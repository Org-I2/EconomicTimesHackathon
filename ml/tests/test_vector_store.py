import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid

import numpy as np

from core.config import settings
from services.vector_store import delete, query, upsert


def _make_vector(seed: int) -> list[float]:
    """Deterministic pseudo-random unit vector of the configured embedding dim."""
    rng = np.random.default_rng(seed)
    vec = rng.normal(size=settings.embedding_dim)
    vec = vec / np.linalg.norm(vec)
    return vec.tolist()


def _nudge(vector: list[float], amount: float = 0.02) -> list[float]:
    """Small perturbation of an existing vector, renormalized — used to
    simulate a second chunk that is semantically 'similar' to the first."""
    rng = np.random.default_rng(123)
    arr = np.array(vector) + rng.normal(scale=amount, size=len(vector))
    arr = arr / np.linalg.norm(arr)
    return arr.tolist()


def test_upsert_and_query_returns_most_similar_first():
    document_id = f"test-doc-{uuid.uuid4()}"

    base_vector = _make_vector(seed=1)
    similar_vector = _nudge(base_vector)
    unrelated_vector = _make_vector(seed=99)

    chunk_base = f"{document_id}::0"
    chunk_similar = f"{document_id}::1"
    chunk_unrelated = f"{document_id}::2"

    upsert(chunk_base, base_vector, {"document_id": document_id, "text": "base chunk"})
    upsert(chunk_similar, similar_vector, {"document_id": document_id, "text": "similar chunk"})
    upsert(chunk_unrelated, unrelated_vector, {"document_id": document_id, "text": "unrelated chunk"})

    results = query(base_vector, top_k=3, filters={"document_id": document_id})

    assert len(results) == 3
    assert results[0]["chunk_id"] == chunk_base
    assert results[0]["score"] > results[-1]["score"]
    # the querying vector is identical to chunk_base's own vector, so
    # cosine similarity should be ~1.0
    assert results[0]["score"] > 0.99

    returned_ids = {r["chunk_id"] for r in results}
    assert returned_ids == {chunk_base, chunk_similar, chunk_unrelated}

    delete(document_id)


def test_query_respects_top_k():
    document_id = f"test-doc-{uuid.uuid4()}"

    for i in range(5):
        vector = _make_vector(seed=i)
        upsert(f"{document_id}::{i}", vector, {"document_id": document_id})

    results = query(_make_vector(seed=0), top_k=2, filters={"document_id": document_id})
    assert len(results) == 2

    delete(document_id)


def test_delete_removes_all_vectors_for_document():
    document_id = f"test-doc-{uuid.uuid4()}"

    for i in range(3):
        vector = _make_vector(seed=i + 10)
        upsert(f"{document_id}::{i}", vector, {"document_id": document_id})

    before = query(_make_vector(seed=10), top_k=10, filters={"document_id": document_id})
    assert len(before) == 3

    delete(document_id)

    after = query(_make_vector(seed=10), top_k=10, filters={"document_id": document_id})
    assert len(after) == 0


def test_delete_does_not_affect_other_documents():
    doc_a = f"test-doc-{uuid.uuid4()}"
    doc_b = f"test-doc-{uuid.uuid4()}"

    vector_a = _make_vector(seed=20)
    vector_b = _make_vector(seed=21)

    upsert(f"{doc_a}::0", vector_a, {"document_id": doc_a})
    upsert(f"{doc_b}::0", vector_b, {"document_id": doc_b})

    delete(doc_a)

    results_a = query(vector_a, top_k=10, filters={"document_id": doc_a})
    results_b = query(vector_b, top_k=10, filters={"document_id": doc_b})

    assert len(results_a) == 0
    assert len(results_b) == 1

    delete(doc_b)


def test_upsert_rejects_metadata_without_document_id():
    try:
        upsert("bad-chunk", _make_vector(seed=42), {"text": "missing document_id"})
        raised = False
    except ValueError:
        raised = True
    assert raised, "Expected upsert() to raise ValueError when metadata lacks document_id"


if __name__ == "__main__":
    test_upsert_and_query_returns_most_similar_first()
    test_query_respects_top_k()
    test_delete_removes_all_vectors_for_document()
    test_delete_does_not_affect_other_documents()
    test_upsert_rejects_metadata_without_document_id()
    print("All tests passed.")
