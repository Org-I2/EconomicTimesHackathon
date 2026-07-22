import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pathlib import Path
from unittest.mock import patch, MagicMock

import httpx

import services.llm_client as llm_client


def _ok_response(json_body: dict) -> MagicMock:
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = json_body
    return response


def _stream_context_manager(lines: list[str]) -> MagicMock:
    """Builds a mock that behaves like httpx.stream(...)'s `with` block."""
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.iter_lines.return_value = lines

    context_manager = MagicMock()
    context_manager.__enter__.return_value = response
    context_manager.__exit__.return_value = False
    return context_manager


def test_reads_api_keys_from_dotenv_file(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text("GROQ_API_KEY=test-key-from-dotenv\n", encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)

    with patch.dict(os.environ, {}, clear=True):
        llm_client.load_dotenv(env_file)
        assert os.environ["GROQ_API_KEY"] == "test-key-from-dotenv"


def test_generate_openai_returns_mocked_text():
    os.environ["LLM_PROVIDER"] = "openai"
    os.environ["OPENAI_API_KEY"] = "test-key"

    fake_response = _ok_response(
        {"choices": [{"message": {"content": "mocked openai response"}}]}
    )

    with patch("services.llm_client.httpx.post", return_value=fake_response) as mock_post:
        result = llm_client.generate("What is the boiling point of water?")

    assert result == "mocked openai response"
    assert mock_post.called


def test_generate_ollama_returns_mocked_text():
    os.environ["LLM_PROVIDER"] = "ollama"

    fake_response = _ok_response({"message": {"content": "mocked ollama response"}})

    with patch("services.llm_client.httpx.post", return_value=fake_response) as mock_post:
        result = llm_client.generate("What is the boiling point of water?")

    assert result == "mocked ollama response"
    assert mock_post.called


def test_generate_gemini_returns_mocked_text():
    os.environ["LLM_PROVIDER"] = "gemini"
    os.environ["GEMINI_API_KEY"] = "test-key"

    fake_response = _ok_response(
        {"candidates": [{"content": {"parts": [{"text": "mocked gemini response"}]}}]}
    )

    with patch("services.llm_client.httpx.post", return_value=fake_response) as mock_post:
        result = llm_client.generate("What is the boiling point of water?")

    assert result == "mocked gemini response"
    assert mock_post.called


def test_generate_groq_returns_mocked_text():
    os.environ["LLM_PROVIDER"] = "groq"
    os.environ["GROQ_API_KEY"] = "test-key"

    fake_response = _ok_response(
        {"choices": [{"message": {"content": "mocked groq response"}}]}
    )

    with patch("services.llm_client.httpx.post", return_value=fake_response) as mock_post:
        result = llm_client.generate("What is the boiling point of water?")

    assert result == "mocked groq response"
    assert mock_post.called
    # Groq is OpenAI-compatible, hit via its own base URL, not OpenAI's
    called_url = mock_post.call_args[0][0]
    assert "api.groq.com" in called_url


def test_generate_raises_llm_client_error_on_http_failure():
    os.environ["LLM_PROVIDER"] = "openai"
    os.environ["OPENAI_API_KEY"] = "test-key"

    fake_response = MagicMock()
    fake_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "bad status", request=MagicMock(), response=MagicMock()
    )

    with patch("services.llm_client.httpx.post", return_value=fake_response):
        try:
            llm_client.generate("hello")
            raised = False
        except llm_client.LLMClientError:
            raised = True

    assert raised, "Expected an HTTP error to surface as LLMClientError, not hang or return silently"


def test_generate_rejects_empty_prompt():
    os.environ["LLM_PROVIDER"] = "openai"
    try:
        llm_client.generate("   ")
        raised = False
    except ValueError:
        raised = True
    assert raised, "Expected empty prompt to raise ValueError"


def test_generate_unknown_provider_raises_llm_client_error():
    os.environ["LLM_PROVIDER"] = "some-unsupported-provider"
    try:
        llm_client.generate("hello")
        raised = False
    except llm_client.LLMClientError:
        raised = True
    assert raised, "Expected an unrecognized LLM_PROVIDER to raise LLMClientError"


def test_generate_stream_openai_yields_mocked_chunks():
    os.environ["LLM_PROVIDER"] = "openai"
    os.environ["OPENAI_API_KEY"] = "test-key"

    sse_lines = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        'data: {"choices":[{"delta":{"content":" world"}}]}',
        "data: [DONE]",
    ]
    stream_cm = _stream_context_manager(sse_lines)

    with patch("services.llm_client.httpx.stream", return_value=stream_cm):
        chunks = list(llm_client.generate_stream("hello"))

    assert chunks == ["Hello", " world"]


def test_is_available_true_when_call_succeeds():
    os.environ["LLM_PROVIDER"] = "openai"
    os.environ["OPENAI_API_KEY"] = "test-key"

    fake_response = MagicMock()
    fake_response.raise_for_status.return_value = None

    with patch("services.llm_client.httpx.get", return_value=fake_response):
        assert llm_client.is_available() is True


def test_is_available_false_when_call_fails():
    os.environ["LLM_PROVIDER"] = "openai"
    os.environ["OPENAI_API_KEY"] = "test-key"

    with patch("services.llm_client.httpx.get", side_effect=httpx.ConnectError("refused")):
        assert llm_client.is_available() is False


def test_is_available_false_when_call_times_out():
    os.environ["LLM_PROVIDER"] = "ollama"

    with patch("services.llm_client.httpx.get", side_effect=httpx.TimeoutException("timed out")):
        assert llm_client.is_available() is False


def test_is_available_false_for_ollama_connection_refused():
    os.environ["LLM_PROVIDER"] = "ollama"

    with patch("services.llm_client.httpx.get", side_effect=httpx.ConnectError("refused")):
        assert llm_client.is_available() is False


def test_is_available_false_when_openai_key_missing():
    os.environ["LLM_PROVIDER"] = "openai"
    os.environ.pop("OPENAI_API_KEY", None)

    assert llm_client.is_available() is False


if __name__ == "__main__":
    test_generate_openai_returns_mocked_text()
    test_generate_ollama_returns_mocked_text()
    test_generate_gemini_returns_mocked_text()
    test_generate_groq_returns_mocked_text()
    test_generate_raises_llm_client_error_on_http_failure()
    test_generate_rejects_empty_prompt()
    test_generate_unknown_provider_raises_llm_client_error()
    test_generate_stream_openai_yields_mocked_chunks()
    test_is_available_true_when_call_succeeds()
    test_is_available_false_when_call_fails()
    test_is_available_false_when_call_times_out()
    test_is_available_false_for_ollama_connection_refused()
    test_is_available_false_when_openai_key_missing()
    print("All tests passed.")
