"""
Central configuration for the Unified Asset & Operations Brain backend.

This module intentionally stays framework-agnostic (no dependency on the
backend engineer's FastAPI setup) so it can be imported freely from any
service module under services/.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # --- Embeddings ---
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dim: int = 384

    # --- Chunking ---
    chunk_size_chars: int = 650
    chunk_overlap_chars: int = 100

    # --- RAG ---
    rag_similarity_threshold: float = 0.35
    default_top_k: int = 6

    # --- Vector store (ChromaDB, local persistent mode) ---
    vector_store_persist_dir: str = "./data/chroma"
    vector_store_collection_name: str = "documents"

    # --- OCR ---
    ocr_low_confidence_threshold: float = 0.40

    # --- LLM (Ollama local fallback) ---
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"

    # --- LLM (Gemini, used for testing via the free tier) ---
    gemini_model: str = "gemini-3.5-flash"
    # API key is read from the GEMINI_API_KEY env var at runtime by
    # llm_client.py, not stored here.


# Single shared instance. Import this, don't instantiate Settings() yourself,
# so every service module sees the same config.
settings = Settings()
