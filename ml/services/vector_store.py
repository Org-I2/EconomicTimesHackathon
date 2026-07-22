"""
Vector store service.

Thin wrapper around a local, embedded, persistent ChromaDB collection.
This is the only module in the codebase that should import chromadb —
the RAG pipeline, knowledge-graph extractor, etc. talk to vectors only
through upsert() / query() / delete().

Storage is on disk (not in-memory) at settings.vector_store_persist_dir,
so the index survives process restarts.

IMPORTANT for callers: every metadata dict passed to upsert() MUST
include a "document_id" key. delete() removes vectors by matching on
that field, so a chunk upserted without it can never be cleaned up.
"""

from __future__ import annotations

import logging

import chromadb

from core.config import settings

logger = logging.getLogger(__name__)

# Loaded once, at module import time, and reused for the lifetime of the
# process — same pattern as services/embeddings.py. PersistentClient
# handles its own connection/locking to the on-disk store.
_client = chromadb.PersistentClient(path=settings.vector_store_persist_dir)

# Cosine space is set explicitly because ChromaDB defaults to l2, and our
# embeddings (services/embeddings.py) are normalized for cosine similarity.
_collection = _client.get_or_create_collection(
    name=settings.vector_store_collection_name,
    metadata={"hnsw:space": "cosine"},
)


def upsert(chunk_id: str, vector: list[float], metadata: dict) -> None:
    """
    Insert or update a single chunk's vector and metadata.

    Args:
        chunk_id: Stable unique ID for this chunk (e.g. "{document_id}::{chunk_index}").
        vector: Embedding vector, e.g. from services.embeddings.embed_text.
        metadata: Arbitrary metadata for filtering/display. MUST include a
            "document_id" key — delete() relies on it.

    Raises:
        ValueError: if chunk_id is empty, vector is empty, or metadata is
            missing "document_id".
    """
    if not chunk_id or not chunk_id.strip():
        raise ValueError("upsert requires a non-empty chunk_id")
    if not vector:
        raise ValueError("upsert requires a non-empty vector")
    if not metadata or "document_id" not in metadata:
        raise ValueError("upsert requires metadata containing a 'document_id' key")

    _collection.upsert(ids=[chunk_id], embeddings=[vector], metadatas=[metadata])


def query(query_vector: list[float], top_k: int, filters: dict = None) -> list[dict]:
    """
    Find the top_k chunks most similar to query_vector.

    Args:
        query_vector: Embedding vector to search against, same dimension
            as vectors passed to upsert().
        top_k: Maximum number of results to return.
        filters: Optional ChromaDB "where" clause to restrict the search,
            e.g. {"document_id": "doc_123"}.

    Returns:
        A list of dicts, ordered by descending similarity:
        [{"chunk_id": str, "score": float, "metadata": dict}, ...]
        score is cosine similarity in [-1, 1] (higher = more similar),
        not a raw distance.

    Raises:
        ValueError: if query_vector is empty or top_k is not positive.
    """
    if not query_vector:
        raise ValueError("query requires a non-empty query_vector")
    if top_k <= 0:
        raise ValueError("query requires top_k > 0")

    kwargs = {"query_embeddings": [query_vector], "n_results": top_k}
    if filters:
        kwargs["where"] = filters

    results = _collection.query(**kwargs)

    ids = results["ids"][0]
    distances = results["distances"][0]
    metadatas = results["metadatas"][0]

    output = []
    for chunk_id, distance, metadata in zip(ids, distances, metadatas):
        # ChromaDB's cosine "distance" is (1 - cosine_similarity), so we
        # convert back to a similarity score for callers (e.g. the RAG
        # pipeline comparing against rag_similarity_threshold).
        score = 1.0 - distance
        output.append({"chunk_id": chunk_id, "score": score, "metadata": metadata})

    return output


def delete(document_id: str) -> None:
    """
    Remove every chunk belonging to a document.

    Args:
        document_id: The document_id value stored in each chunk's metadata
            at upsert() time.

    Raises:
        ValueError: if document_id is empty.
    """
    if not document_id or not document_id.strip():
        raise ValueError("delete requires a non-empty document_id")

    _collection.delete(where={"document_id": document_id})
