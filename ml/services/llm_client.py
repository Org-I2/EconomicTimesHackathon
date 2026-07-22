"""
LLM client service.

A single swappable interface over multiple LLM backends, so the RAG
pipeline and root-cause-analysis code never talk to OpenAI/Ollama/Gemini
directly — they only call generate() / generate_stream() / is_available().

Provider selection is read from the LLM_PROVIDER env var on every call
(not cached at import time), so it can be swapped mid-process — e.g. in
tests, or if a caller wants to force a fallback provider.

Supported providers: "openai" (default), "groq" (OpenAI-compatible, just
a different base URL/key — see console.groq.com), "ollama" (free local
fallback via core.config's ollama_base_url/ollama_model), and "gemini"
(free hosted API, used for testing — see core.config's gemini_model).

Env vars:
    LLM_PROVIDER   "openai" | "groq" | "ollama" | "gemini"   (default: "openai")
    OPENAI_API_KEY required when LLM_PROVIDER=openai
    OPENAI_MODEL   default: "gpt-4o-mini"
    GROQ_API_KEY   required when LLM_PROVIDER=groq
    GROQ_MODEL     default: "llama-3.3-70b-versatile"
    GEMINI_API_KEY required when LLM_PROVIDER=gemini

All failures (missing credentials, network errors, non-2xx responses,
timeouts, malformed responses) raise LLMClientError rather than hanging
or returning a silently-empty result. is_available() is the one place
that catches LLMClientError (and any other exception) and turns it into
a plain False.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Iterator

import httpx
from dotenv import load_dotenv

from core.config import settings

logger = logging.getLogger(__name__)

load_dotenv()

_GENERATE_TIMEOUT_SECONDS = 60.0
_AVAILABILITY_TIMEOUT_SECONDS = 5.0

# Groq's API is OpenAI-compatible (same request/response shape for chat
# completions), so it's implemented as a second entry in this table rather
# than a separate code path — only base_url/api_key/model differ.
_OPENAI_STYLE_PROVIDERS = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "api_key_env": "OPENAI_API_KEY",
        "model_env": "OPENAI_MODEL",
        "default_model": "gpt-4o-mini",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "api_key_env": "GROQ_API_KEY",
        "model_env": "GROQ_MODEL",
        "default_model": "llama-3.3-70b-versatile",
    },
}

_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


class LLMClientError(Exception):
    """Raised for any provider failure: missing credentials, network
    errors, non-2xx responses, timeouts, or malformed responses."""


def _get_provider() -> str:
    return os.environ.get("LLM_PROVIDER", "openai").strip().lower()


def _get_api_key(api_key_env: str) -> str:
    api_key = os.environ.get(api_key_env)
    if not api_key:
        api_key = os.getenv(api_key_env)
    if not api_key:
        raise LLMClientError(f"{api_key_env} is not set")
    return api_key


def _build_messages(prompt: str, system_prompt: str = None) -> list[dict]:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    return messages




def _openai_style_headers(api_key_env: str) -> dict:
    api_key = _get_api_key(api_key_env)
    return {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}


def _openai_style_model(model_env: str, default_model: str) -> str:
    return os.environ.get(model_env, default_model)


def _generate_openai_style(
    prompt: str, system_prompt: str, max_tokens: int, provider_config: dict
) -> str:
    try:
        response = httpx.post(
            f"{provider_config['base_url']}/chat/completions",
            headers=_openai_style_headers(provider_config["api_key_env"]),
            json={
                "model": _openai_style_model(
                    provider_config["model_env"], provider_config["default_model"]
                ),
                "messages": _build_messages(prompt, system_prompt),
                "max_tokens": max_tokens,
            },
            timeout=_GENERATE_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except LLMClientError:
        raise
    except Exception as exc:
        raise LLMClientError(f"{provider_config['base_url']} generate() failed: {exc}") from exc


def _generate_openai_style_stream(
    prompt: str, system_prompt: str, provider_config: dict
) -> Iterator[str]:
    try:
        with httpx.stream(
            "POST",
            f"{provider_config['base_url']}/chat/completions",
            headers=_openai_style_headers(provider_config["api_key_env"]),
            json={
                "model": _openai_style_model(
                    provider_config["model_env"], provider_config["default_model"]
                ),
                "messages": _build_messages(prompt, system_prompt),
                "stream": True,
            },
            timeout=_GENERATE_TIMEOUT_SECONDS,
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if not line or not line.startswith("data: "):
                    continue
                payload = line[len("data: "):].strip()
                if payload == "[DONE]":
                    break
                chunk = json.loads(payload)
                delta = chunk["choices"][0].get("delta", {}).get("content")
                if delta:
                    yield delta
    except LLMClientError:
        raise
    except Exception as exc:
        raise LLMClientError(
            f"{provider_config['base_url']} generate_stream() failed: {exc}"
        ) from exc


# --------------------------------------------------------------------------
# Ollama (free local fallback)
# --------------------------------------------------------------------------

def _ollama_url(path: str) -> str:
    return f"{settings.ollama_base_url}{path}"


def _generate_ollama(prompt: str, system_prompt: str, max_tokens: int) -> str:
    try:
        response = httpx.post(
            _ollama_url("/api/chat"),
            json={
                "model": settings.ollama_model,
                "messages": _build_messages(prompt, system_prompt),
                "stream": False,
                "options": {"num_predict": max_tokens},
            },
            timeout=_GENERATE_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"]
    except LLMClientError:
        raise
    except Exception as exc:
        raise LLMClientError(f"Ollama generate() failed: {exc}") from exc


def _generate_ollama_stream(prompt: str, system_prompt: str) -> Iterator[str]:
    try:
        with httpx.stream(
            "POST",
            _ollama_url("/api/chat"),
            json={
                "model": settings.ollama_model,
                "messages": _build_messages(prompt, system_prompt),
                "stream": True,
            },
            timeout=_GENERATE_TIMEOUT_SECONDS,
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if not line:
                    continue
                chunk = json.loads(line)
                content = chunk.get("message", {}).get("content")
                if content:
                    yield content
                if chunk.get("done"):
                    break
    except LLMClientError:
        raise
    except Exception as exc:
        raise LLMClientError(f"Ollama generate_stream() failed: {exc}") from exc


# --------------------------------------------------------------------------
# Gemini (free hosted API — used for testing)
# --------------------------------------------------------------------------

def _gemini_api_key() -> str:
    return _get_api_key("GEMINI_API_KEY")


def _gemini_payload(prompt: str, system_prompt: str, max_tokens: int) -> dict:
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens},
    }
    if system_prompt:
        payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}
    return payload


def _generate_gemini(prompt: str, system_prompt: str, max_tokens: int) -> str:
    try:
        url = f"{_GEMINI_BASE_URL}/models/{settings.gemini_model}:generateContent"
        response = httpx.post(
            url,
            params={"key": _gemini_api_key()},
            json=_gemini_payload(prompt, system_prompt, max_tokens),
            timeout=_GENERATE_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except LLMClientError:
        raise
    except Exception as exc:
        raise LLMClientError(f"Gemini generate() failed: {exc}") from exc


def _generate_gemini_stream(prompt: str, system_prompt: str) -> Iterator[str]:
    try:
        url = f"{_GEMINI_BASE_URL}/models/{settings.gemini_model}:streamGenerateContent"
        with httpx.stream(
            "POST",
            url,
            params={"key": _gemini_api_key(), "alt": "sse"},
            json=_gemini_payload(prompt, system_prompt, max_tokens=2048),
            timeout=_GENERATE_TIMEOUT_SECONDS,
        ) as response:
            response.raise_for_status()
            for line in response.iter_lines():
                if not line or not line.startswith("data: "):
                    continue
                chunk = json.loads(line[len("data: "):].strip())
                for candidate in chunk.get("candidates", []):
                    for part in candidate.get("content", {}).get("parts", []):
                        text = part.get("text")
                        if text:
                            yield text
    except LLMClientError:
        raise
    except Exception as exc:
        raise LLMClientError(f"Gemini generate_stream() failed: {exc}") from exc


# --------------------------------------------------------------------------
# Public interface
# --------------------------------------------------------------------------

def generate(prompt: str, system_prompt: str = None, max_tokens: int = 512) -> str:
    """
    Generate a single complete response from the configured provider.

    Args:
        prompt: The user-facing prompt/question.
        system_prompt: Optional system instructions (e.g. "answer only
            from the provided context, say 'not enough info' otherwise").
        max_tokens: Max tokens in the response.

    Returns:
        The generated text.

    Raises:
        ValueError: if prompt is empty/whitespace-only.
        LLMClientError: on any provider failure (missing credentials,
            network error, non-2xx response, timeout, malformed response,
            or an unrecognized LLM_PROVIDER value).
    """
    if not prompt or not prompt.strip():
        raise ValueError("generate requires a non-empty prompt")

    provider = _get_provider()
    if provider == "openai":
        return _generate_openai_style(prompt, system_prompt, max_tokens, _OPENAI_STYLE_PROVIDERS["openai"])
    if provider == "groq":
        return _generate_openai_style(prompt, system_prompt, max_tokens, _OPENAI_STYLE_PROVIDERS["groq"])
    if provider == "ollama":
        return _generate_ollama(prompt, system_prompt, max_tokens)
    if provider == "gemini":
        return _generate_gemini(prompt, system_prompt, max_tokens)
    raise LLMClientError(
        f"Unknown LLM_PROVIDER '{provider}' (expected 'openai', 'groq', 'ollama', or 'gemini')"
    )


def generate_stream(prompt: str, system_prompt: str = None) -> Iterator[str]:
    """
    Generate a response from the configured provider as a stream of
    text chunks, yielded as they arrive.

    Args:
        prompt: The user-facing prompt/question.
        system_prompt: Optional system instructions.

    Yields:
        Successive text chunks (not necessarily whole words/tokens).

    Raises:
        ValueError: if prompt is empty/whitespace-only.
        LLMClientError: on any provider failure, raised during iteration
            (since streaming is lazy — the request isn't sent until the
            first chunk is pulled).
    """
    if not prompt or not prompt.strip():
        raise ValueError("generate_stream requires a non-empty prompt")

    provider = _get_provider()
    if provider == "openai":
        yield from _generate_openai_style_stream(prompt, system_prompt, _OPENAI_STYLE_PROVIDERS["openai"])
    elif provider == "groq":
        yield from _generate_openai_style_stream(prompt, system_prompt, _OPENAI_STYLE_PROVIDERS["groq"])
    elif provider == "ollama":
        yield from _generate_ollama_stream(prompt, system_prompt)
    elif provider == "gemini":
        yield from _generate_gemini_stream(prompt, system_prompt)
    else:
        raise LLMClientError(
            f"Unknown LLM_PROVIDER '{provider}' (expected 'openai', 'groq', 'ollama', or 'gemini')"
        )


def is_available() -> bool:
    """
    Check whether the configured provider is reachable and usable right
    now, without generating a real completion (so it doesn't burn quota).

    Uses a short timeout and never raises — any failure (missing
    credentials, connection error, timeout, non-2xx response, or an
    unrecognized LLM_PROVIDER) results in False rather than propagating.

    Returns:
        True if the provider responded successfully, False otherwise.
    """
    provider = _get_provider()
    try:
        if provider in ("openai", "groq"):
            provider_config = _OPENAI_STYLE_PROVIDERS[provider]
            response = httpx.get(
                f"{provider_config['base_url']}/models",
                headers=_openai_style_headers(provider_config["api_key_env"]),
                timeout=_AVAILABILITY_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            return True

        if provider == "ollama":
            response = httpx.get(
                _ollama_url("/api/tags"),
                timeout=_AVAILABILITY_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            return True

        if provider == "gemini":
            response = httpx.get(
                f"{_GEMINI_BASE_URL}/models",
                params={"key": _gemini_api_key()},
                timeout=_AVAILABILITY_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            return True

        return False
    except Exception as exc:
        logger.warning("is_available() check failed for provider '%s': %s", provider, exc)
        return False
