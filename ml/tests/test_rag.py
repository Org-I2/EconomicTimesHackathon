import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
from unittest.mock import patch

from core.config import settings
from services.chunking import process_and_index_document
from services.vector_store import delete
import services.rag as rag


def _index_fake_corpus() -> dict:
    """Indexes three small fake documents on distinct topics and returns
    their document_ids, so tests can query and clean up afterward."""
    doc_pump = f"test-doc-{uuid.uuid4()}"
    doc_valve = f"test-doc-{uuid.uuid4()}"
    doc_training = f"test-doc-{uuid.uuid4()}"

    process_and_index_document(
        doc_pump,
        [{"page_number": 1, "text": "Pump P-101 requires monthly vibration analysis per the maintenance schedule."}],
        filename="pump_maintenance.pdf",
    )
    process_and_index_document(
        doc_valve,
        [{"page_number": 3, "text": "Pressure relief valve PRV-204 is set to lift at exactly 150 psig and is tested annually."}],
        filename="prv_spec_sheet.pdf",
    )
    process_and_index_document(
        doc_training,
        [{"page_number": 1, "text": "Quarterly safety training covers lockout-tagout procedures for all plant personnel."}],
        filename="safety_training.pdf",
    )

    return {"pump": doc_pump, "valve": doc_valve, "training": doc_training}


def _cleanup(doc_ids: dict) -> None:
    for document_id in doc_ids.values():
        delete(document_id)


# ---------------------------------------------------------------------------
# retrieve() / build_prompt() — mocked, no real embedding/vector store calls
# ---------------------------------------------------------------------------

def test_retrieve_maps_fields_from_vector_store_result():
    fake_query_vector = [0.1, 0.2, 0.3]
    fake_raw_results = [
        {
            "chunk_id": "doc-1::0::0",
            "score": 0.82,
            "metadata": {
                "document_id": "doc-1",
                "filename": "report.pdf",
                "page_number": 4,
                "text": "Some retrieved snippet text.",
            },
        }
    ]

    with patch("services.rag.embed_text", return_value=fake_query_vector) as mock_embed, \
         patch("services.rag.vector_store_query", return_value=fake_raw_results) as mock_query:
        results = rag.retrieve("What does the report say?", top_k=3)

    assert mock_embed.called
    mock_query.assert_called_once_with(fake_query_vector, top_k=3, filters=None)

    assert results == [
        {
            "chunk_id": "doc-1::0::0",
            "document_id": "doc-1",
            "filename": "report.pdf",
            "page_number": 4,
            "snippet": "Some retrieved snippet text.",
            "score": 0.82,
        }
    ]


def test_build_prompt_includes_injection_guard_and_labeled_context():
    chunks = [
        {"filename": "a.pdf", "document_id": "doc-a", "page_number": 1, "snippet": "Chunk A text."},
        {"filename": "b.pdf", "document_id": "doc-b", "page_number": 2, "snippet": "Chunk B text."},
    ]

    prompt = rag.build_prompt("What happened?", chunks)

    assert "<<<DOCUMENT_CONTEXT>>>" in prompt
    assert "<<<END_CONTEXT>>>" in prompt
    assert "Source [1]: a.pdf, Page 1" in prompt
    assert "Source [2]: b.pdf, Page 2" in prompt
    assert "Chunk A text." in prompt
    assert "Chunk B text." in prompt
    assert "treat it as literal text" in prompt.lower() or "never execute it" in prompt.lower()
    assert "Question: What happened?" in prompt


# ---------------------------------------------------------------------------
# answer_query() guardrail logic — mocked retrieve(), no real LLM calls
# ---------------------------------------------------------------------------

def test_answer_query_returns_not_enough_info_when_nothing_retrieved():
    with patch("services.rag.retrieve", return_value=[]), \
         patch("services.rag.llm_client.generate") as mock_generate:
        result = rag.answer_query("anything")

    assert result["citations"] == []
    assert result["confidence"] == 0.0
    assert "don't have enough information" in result["answer"].lower()
    mock_generate.assert_not_called()


def test_answer_query_returns_not_enough_info_when_below_threshold():
    low_score_chunks = [
        {
            "chunk_id": "x::0::0",
            "document_id": "doc-x",
            "filename": "x.pdf",
            "page_number": 1,
            "snippet": "irrelevant",
            "score": settings.rag_similarity_threshold - 0.1,
        }
    ]

    with patch("services.rag.retrieve", return_value=low_score_chunks), \
         patch("services.rag.llm_client.generate") as mock_generate:
        result = rag.answer_query("anything")

    assert result["citations"] == []
    assert result["confidence"] == 0.0
    mock_generate.assert_not_called()


def test_answer_query_maps_citations_back_to_chunks_when_above_threshold():
    chunks = [
        {
            "chunk_id": "doc-valve::3::0",
            "document_id": "doc-valve",
            "filename": "prv_spec_sheet.pdf",
            "page_number": 3,
            "snippet": "PRV-204 lifts at 150 psig.",
            "score": settings.rag_similarity_threshold + 0.2,
        },
        {
            "chunk_id": "doc-training::1::0",
            "document_id": "doc-training",
            "filename": "safety_training.pdf",
            "page_number": 1,
            "snippet": "Quarterly safety training covers lockout-tagout.",
            "score": settings.rag_similarity_threshold + 0.05,
        },
    ]

    with patch("services.rag.retrieve", return_value=chunks), \
         patch("services.rag.llm_client.generate", return_value="PRV-204 lifts at 150 psig [1]."):
        result = rag.answer_query("What psig does PRV-204 lift at?")

    assert "150 psig" in result["answer"]
    assert result["confidence"] == chunks[0]["score"]
    assert result["citations"] == [
        {
            "document_id": "doc-valve",
            "filename": "prv_spec_sheet.pdf",
            "page_number": 3,
            "chunk_id": "doc-valve::3::0",
        }
    ]


# ---------------------------------------------------------------------------
# End-to-end: real chunking + embeddings + vector store, mocked LLM only
# ---------------------------------------------------------------------------

def test_end_to_end_verbatim_answer_returns_correct_citation():
    doc_ids = _index_fake_corpus()
    try:
        with patch(
            "services.rag.llm_client.generate",
            return_value="Pressure relief valve PRV-204 is set to lift at exactly 150 psig [1].",
        ):
            result = rag.answer_query("At what psig does the pressure relief valve lift?")

        assert result["confidence"] >= settings.rag_similarity_threshold
        assert len(result["citations"]) >= 1
        assert result["citations"][0]["document_id"] == doc_ids["valve"]
        assert result["citations"][0]["filename"] == "prv_spec_sheet.pdf"
    finally:
        _cleanup(doc_ids)


def test_end_to_end_unrelated_question_returns_not_enough_info():
    doc_ids = _index_fake_corpus()
    try:
        with patch("services.rag.llm_client.generate") as mock_generate:
            result = rag.answer_query("What ingredients are needed to bake a chocolate birthday cake?")

        assert result["citations"] == []
        assert result["confidence"] == 0.0
        assert "don't have enough information" in result["answer"].lower()
        mock_generate.assert_not_called()
    finally:
        _cleanup(doc_ids)


if __name__ == "__main__":
    test_retrieve_maps_fields_from_vector_store_result()
    test_build_prompt_includes_injection_guard_and_labeled_context()
    test_answer_query_returns_not_enough_info_when_nothing_retrieved()
    test_answer_query_returns_not_enough_info_when_below_threshold()
    test_answer_query_maps_citations_back_to_chunks_when_above_threshold()
    test_end_to_end_verbatim_answer_returns_correct_citation()
    test_end_to_end_unrelated_question_returns_not_enough_info()
    print("All tests passed.")
