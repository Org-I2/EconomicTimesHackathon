"""
Embedding service.

Wraps sentence-transformers so the rest of the codebase (RAG pipeline,
vector index builder, knowledge-graph extractor) never has to import
sentence-transformers directly or think about model loading.

The model is loaded exactly once at import time and reused for every
call in this process. Do NOT instantiate SentenceTransformer inside
embed_text/embed_batch — that would reload the model (and its weights)
on every single call, which is both slow and wasteful.
"""

from __future__ import annotations

import logging

from sentence_transformers import SentenceTransformer

from core.config import settings

logger = logging.getLogger(__name__)

# Loaded once, at module import time, and reused for the lifetime of the process.
_model = SentenceTransformer(settings.embedding_model)


def embed_text(text: str) -> list[float]:
    """
    Embed a single string.

    Args:
        text: Raw text to embed. Callers are responsible for chunking
            long documents before calling this (see chunking config in
            core.config: chunk_size_chars / chunk_overlap_chars).

    Returns:
        A list of floats of length settings.embedding_dim.

    Raises:
        ValueError: if text is empty/whitespace-only, since embedding
            an empty string produces a degenerate vector that pollutes
            the vector index and RAG retrieval.
    """
    if not text or not text.strip():
        raise ValueError("embed_text received empty or whitespace-only text")

    vector = _model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
    return vector.tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed a batch of strings in one forward pass (much faster than
    calling embed_text in a loop for anything more than a handful of
    chunks, e.g. when indexing a whole document).

    Args:
        texts: List of raw text chunks to embed. Must be non-empty and
            contain no empty/whitespace-only entries.

    Returns:
        A list of embedding vectors (list[float]), same order and length
        as `texts`, each of length settings.embedding_dim.

    Raises:
        ValueError: if texts is empty, or if any individual entry is
            empty/whitespace-only.
    """
    if not texts:
        raise ValueError("embed_batch received an empty list")
    if any(not t or not t.strip() for t in texts):
        raise ValueError("embed_batch received an empty or whitespace-only entry")

    vectors = _model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return vectors.tolist()
