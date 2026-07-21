import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid

from core.config import settings
from services.chunking import chunk_text, process_and_index_document
from services.embeddings import embed_text
from services.vector_store import delete, query


def _fake_document_pages() -> list[dict]:
    """A small multi-page fake document with distinct topics per page,
    so retrieval tests can check that a query lands on the right page."""
    return [
        {
            "page_number": 1,
            "text": (
                "Pump P-101 is a centrifugal pump located in the process area. "
                "It requires monthly vibration analysis per the maintenance schedule. "
                "The last inspection found no abnormal wear on the bearing housing. "
                "Operators should log discharge pressure readings every shift. "
            )
            * 3,
        },
        {
            "page_number": 2,
            "text": (
                "Pressure relief valve PRV-204 protects the downstream separator vessel. "
                "It is set to lift at 150 psig and must be tested annually per API 510. "
                "The valve was last recertified in March and passed all bench tests. "
                "Any observed chatter during operation should be reported immediately. "
            )
            * 3,
        },
        {
            "page_number": 3,
            "text": "   ",  # whitespace-only page — should contribute zero chunks
        },
    ]


def test_chunk_text_splits_long_text_into_multiple_chunks():
    long_text = "This is a sentence about pumps. " * 60
    chunks = chunk_text(long_text, chunk_size=200, overlap=40)

    assert len(chunks) > 1
    for chunk in chunks:
        assert chunk.strip() == chunk  # no leading/trailing whitespace
        assert len(chunk) > 0


def test_chunk_text_skips_empty_and_whitespace_input():
    assert chunk_text("") == []
    assert chunk_text("   \n\t  ") == []


def test_chunk_text_rejects_invalid_overlap():
    try:
        chunk_text("some text here", chunk_size=100, overlap=100)
        raised = False
    except ValueError:
        raised = True
    assert raised, "Expected overlap >= chunk_size to raise ValueError"


def test_process_and_index_document_returns_positive_count():
    document_id = f"test-doc-{uuid.uuid4()}"
    pages = _fake_document_pages()

    chunk_count = process_and_index_document(document_id, pages)

    assert chunk_count > 0

    delete(document_id)


def test_indexed_chunks_are_retrievable_via_query():
    document_id = f"test-doc-{uuid.uuid4()}"
    pages = _fake_document_pages()

    process_and_index_document(document_id, pages)

    query_vector = embed_text("What is the pressure relief valve set to lift at?")
    results = query(query_vector, top_k=3, filters={"document_id": document_id})

    assert len(results) > 0
    top_result = results[0]
    assert top_result["metadata"]["document_id"] == document_id
    # the best match should come from page 2, which is about PRV-204
    assert top_result["metadata"]["page_number"] == 2
    assert "PRV-204" in top_result["metadata"]["text"] or "relief valve" in top_result["metadata"]["text"]

    delete(document_id)


def test_rerunning_after_delete_does_not_duplicate_vectors():
    document_id = f"test-doc-{uuid.uuid4()}"
    pages = _fake_document_pages()

    first_count = process_and_index_document(document_id, pages)

    query_vector = embed_text("pump maintenance schedule")
    first_results = query(query_vector, top_k=50, filters={"document_id": document_id})
    assert len(first_results) == first_count

    delete(document_id)
    after_delete_results = query(query_vector, top_k=50, filters={"document_id": document_id})
    assert len(after_delete_results) == 0

    second_count = process_and_index_document(document_id, pages)
    assert second_count == first_count

    second_results = query(query_vector, top_k=50, filters={"document_id": document_id})
    assert len(second_results) == first_count, (
        f"Expected re-indexing to replace, not duplicate, vectors "
        f"(first={first_count}, after re-run={len(second_results)})"
    )

    delete(document_id)


def test_process_and_index_document_rejects_empty_document_id():
    try:
        process_and_index_document("", _fake_document_pages())
        raised = False
    except ValueError:
        raised = True
    assert raised, "Expected empty document_id to raise ValueError"


def test_process_and_index_document_handles_empty_pages_list():
    assert process_and_index_document(f"test-doc-{uuid.uuid4()}", []) == 0


if __name__ == "__main__":
    test_chunk_text_splits_long_text_into_multiple_chunks()
    test_chunk_text_skips_empty_and_whitespace_input()
    test_chunk_text_rejects_invalid_overlap()
    test_process_and_index_document_returns_positive_count()
    test_indexed_chunks_are_retrievable_via_query()
    test_rerunning_after_delete_does_not_duplicate_vectors()
    test_process_and_index_document_rejects_empty_document_id()
    test_process_and_index_document_handles_empty_pages_list()
    print("All tests passed.")
