import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np

from core.config import settings
from services.embeddings import embed_batch, embed_text


def cosine_similarity(a: list[float], b: list[float]) -> float:
    a_arr = np.array(a)
    b_arr = np.array(b)
    return float(
        np.dot(a_arr, b_arr) / (np.linalg.norm(a_arr) * np.linalg.norm(b_arr))
    )


def test_embed_text_output_length():
    vector = embed_text("Pump P-101 requires monthly vibration analysis.")
    assert len(vector) == settings.embedding_dim


def test_embed_text_returns_floats():
    vector = embed_text("Inspect pressure relief valve PRV-204 annually.")
    assert all(isinstance(x, float) for x in vector)


def test_similar_sentences_have_high_similarity():
    v1 = embed_text("The centrifugal pump is leaking oil from the seal.")
    v2 = embed_text("Oil is leaking from the centrifugal pump's seal.")
    similarity = cosine_similarity(v1, v2)
    assert similarity > 0.75, f"Expected high similarity, got {similarity:.3f}"


def test_unrelated_sentences_have_low_similarity():
    v1 = embed_text("The centrifugal pump is leaking oil from the seal.")
    v2 = embed_text("Quarterly safety training is scheduled for next Tuesday.")
    similarity = cosine_similarity(v1, v2)
    assert similarity < 0.5, f"Expected low similarity, got {similarity:.3f}"


def test_embed_text_rejects_empty_string():
    try:
        embed_text("   ")
        raised = False
    except ValueError:
        raised = True
    assert raised, "Expected embed_text('   ') to raise ValueError"


def test_embed_batch_matches_embed_text():
    texts = [
        "Valve V-12 was replaced during the last turnaround.",
        "Heat exchanger E-4 fouling rate exceeds design limits.",
    ]
    batch_vectors = embed_batch(texts)

    assert len(batch_vectors) == len(texts)
    for vec in batch_vectors:
        assert len(vec) == settings.embedding_dim

    # embed_batch and embed_text should produce (near) identical vectors
    # for the same input, up to floating point differences from batching.
    individual_vectors = [embed_text(t) for t in texts]
    for batch_vec, individual_vec in zip(batch_vectors, individual_vectors):
        similarity = cosine_similarity(batch_vec, individual_vec)
        assert similarity > 0.999


def test_embed_batch_rejects_empty_list():
    try:
        embed_batch([])
        raised = False
    except ValueError:
        raised = True
    assert raised, "Expected embed_batch([]) to raise ValueError"


def test_embed_batch_rejects_blank_entry():
    try:
        embed_batch(["valid text here", "   "])
        raised = False
    except ValueError:
        raised = True
    assert raised, "Expected embed_batch(['valid text here', '   ']) to raise ValueError"


if __name__ == "__main__":
    test_embed_text_output_length()
    test_embed_text_returns_floats()
    test_similar_sentences_have_high_similarity()
    test_unrelated_sentences_have_low_similarity()
    test_embed_text_rejects_empty_string()
    test_embed_batch_matches_embed_text()
    test_embed_batch_rejects_empty_list()
    test_embed_batch_rejects_blank_entry()
    print("All tests passed.")
