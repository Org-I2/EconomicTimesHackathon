"""
Chunking + indexing service.

chunk_text() splits raw page text into overlapping chunks sized for
embedding (see core.config: chunk_size_chars / chunk_overlap_chars).

process_and_index_document() is the glue: for a whole document's pages,
it chunks each page, embeds the chunks in batches, and upserts them into
the vector store with document_id/page_number metadata attached — this is
what document ingestion actually calls.
"""

from __future__ import annotations

import logging

from core.config import settings
from services.embeddings import embed_batch
from services.vector_store import upsert

logger = logging.getLogger(__name__)

# Sentence-ending punctuation we prefer to break chunks on, so a chunk
# doesn't end mid-sentence when it doesn't have to.
_SENTENCE_ENDINGS = ".!?"

# How far back from the naive chunk_size boundary we're willing to search
# for a sentence ending before giving up and just cutting at chunk_size.
# Capped so we don't end up with a tiny sliver of a chunk.
_MAX_LOOKBACK = 150


def chunk_text(
    text: str,
    chunk_size: int = settings.chunk_size_chars,
    overlap: int = settings.chunk_overlap_chars,
) -> list[str]:
    """
    Split text into overlapping chunks, preferring to break on sentence
    punctuation near the chunk_size boundary rather than mid-sentence.

    Args:
        text: Raw text to split (e.g. one page of a document).
        chunk_size: Target max characters per chunk.
        overlap: Characters of overlap carried from the end of one chunk
            into the start of the next, so context isn't lost at chunk
            boundaries.

    Returns:
        List of chunk strings, each stripped of leading/trailing
        whitespace. Empty/whitespace-only chunks are skipped. Returns
        [] for empty/whitespace-only input.

    Raises:
        ValueError: if chunk_size <= 0, overlap < 0, or overlap >= chunk_size
            (which would prevent the window from making forward progress).
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0:
        raise ValueError("overlap must be non-negative")
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    if not text or not text.strip():
        return []

    lookback = min(_MAX_LOOKBACK, chunk_size // 4)
    text_len = len(text)

    chunks = []
    start = 0

    while start < text_len:
        naive_end = min(start + chunk_size, text_len)

        if naive_end == text_len:
            end = text_len
        else:
            search_start = max(start, naive_end - lookback)
            end = naive_end
            for i in range(naive_end - 1, search_start - 1, -1):
                if text[i] in _SENTENCE_ENDINGS:
                    end = i + 1  # keep the punctuation in this chunk
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= text_len:
            break

        next_start = end - overlap
        if next_start <= start:
            # guard against non-progress if overlap ate the whole chunk
            next_start = end
        start = next_start

    return chunks


def process_and_index_document(document_id: str, pages: list[dict], filename: str = None) -> int:
    """
    Chunk, embed, and index every page of a document.

    For each page: chunk_text() -> embeddings.embed_batch() ->
    vector_store.upsert() per chunk, with document_id and page_number
    attached to each chunk's metadata (plus the chunk's own text, so
    downstream RAG retrieval has the actual content to cite without a
    second lookup).

    Chunk IDs are deterministic ("{document_id}::{page_number}::{chunk_index}"),
    so re-running this for the same document_id and pages upserts (replaces)
    the same vectors rather than creating duplicates.

    Args:
        document_id: Stable ID for the source document.
        pages: [{"page_number": int, "text": str}, ...]
        filename: Optional original filename (e.g. "inspection_report.pdf"),
            stored in each chunk's metadata so downstream retrieval (see
            services.rag.retrieve) can show a human-readable source. If
            omitted, chunks are stored with filename="".

    Returns:
        Total number of chunks created (and indexed) across all pages.

    Raises:
        ValueError: if document_id is empty, or a page dict is missing
            "page_number".
    """
    if not document_id or not document_id.strip():
        raise ValueError("process_and_index_document requires a non-empty document_id")

    if not pages:
        return 0

    total_chunks = 0

    for page in pages:
        if "page_number" not in page:
            raise ValueError("each page dict must include 'page_number'")

        page_number = page["page_number"]
        page_text = page.get("text", "")

        page_chunks = chunk_text(page_text)
        if not page_chunks:
            continue

        vectors = embed_batch(page_chunks)

        for chunk_index, (chunk, vector) in enumerate(zip(page_chunks, vectors)):
            chunk_id = f"{document_id}::{page_number}::{chunk_index}"
            metadata = {
                "document_id": document_id,
                "page_number": page_number,
                "chunk_index": chunk_index,
                "text": chunk,
                "filename": filename or "",
            }
            upsert(chunk_id, vector, metadata)
            total_chunks += 1

    return total_chunks