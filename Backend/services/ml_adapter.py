import json
import logging
import re
from typing import List, Dict, Any, Optional

# Import config first to ensure sys.path is patched and settings are configured
from Backend import config

from services import embeddings
from services import chunking
from services import vector_store
from services import ocr
from services import rag
from services import llm_client

logger = logging.getLogger(__name__)

# --- Embeddings Wrapper ---

def embed_text(text: str) -> List[float]:
    """Wraps services.embeddings.embed_text."""
    return embeddings.embed_text(text)

def embed_batch(texts: List[str]) -> List[List[float]]:
    """Wraps services.embeddings.embed_batch."""
    return embeddings.embed_batch(texts)


# --- Chunking Wrapper ---

def chunk_text(text: str, chunk_size: Optional[int] = None, overlap: Optional[int] = None) -> List[str]:
    """Wraps services.chunking.chunk_text."""
    kwargs = {}
    if chunk_size is not None:
        kwargs["chunk_size"] = chunk_size
    if overlap is not None:
        kwargs["overlap"] = overlap
    return chunking.chunk_text(text, **kwargs)

def process_and_index_document(document_id: str, pages: List[Dict[str, Any]], filename: Optional[str] = None) -> int:
    """Wraps services.chunking.process_and_index_document.
    
    Args:
        document_id: The UUID string of the document.
        pages: [{"page_number": int, "text": str}]
        filename: Optional filename.
    """
    return chunking.process_and_index_document(document_id, pages, filename)


# --- Vector Store Wrapper ---

def delete_vectors(document_id: str) -> None:
    """Wraps services.vector_store.delete."""
    vector_store.delete(document_id)

def query_vector_store(query_vector: List[float], top_k: int, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Wraps services.vector_store.query."""
    return vector_store.query(query_vector, top_k, filters)


# --- OCR Wrapper ---

def extract_text_from_image(image_bytes: bytes) -> Dict[str, Any]:
    """Wraps services.ocr.extract_text_from_image.
    
    Returns: {"text": str, "average_confidence": float}
    """
    return ocr.extract_text_from_image(image_bytes)

def extract_text_from_pdf_page(pdf_path: str, page_num: int) -> Dict[str, Any]:
    """Wraps services.ocr.extract_text_from_pdf_page.
    
    Returns: {"text": str, "average_confidence": float}
    """
    return ocr.extract_text_from_pdf_page(pdf_path, page_num)


# --- RAG Wrapper ---

def answer_query(query: str, top_k: Optional[int] = None, conversation_history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Wraps services.rag.answer_query.
    
    Returns: {"answer": str, "citations": [{"document_id", "filename", "page_number", "chunk_id"}], "confidence": float}
    """
    kwargs = {}
    if top_k is not None:
        kwargs["top_k"] = top_k
    if conversation_history is not None:
        kwargs["conversation_history"] = conversation_history
    return rag.answer_query(query, **kwargs)


# --- LLM Client & Health Check Wrapper ---

def generate_llm_response(prompt: str, system_prompt: Optional[str] = None, max_tokens: int = 512) -> str:
    """Wraps services.llm_client.generate."""
    return llm_client.generate(prompt, system_prompt=system_prompt, max_tokens=max_tokens)

def check_llm_availability() -> bool:
    """Wraps services.llm_client.is_available."""
    return llm_client.is_available()


# --- Knowledge Graph Entity & Relation Extractor (LLM-based) ---

_KG_EXTRACTION_SYSTEM_PROMPT = (
    "You are an expert industrial knowledge engineer. Your task is to analyze plant documentation "
    "and extract entities and relationships to build a highly structured knowledge graph."
)

_KG_EXTRACTION_USER_PROMPT_TEMPLATE = """
Analyze the following text block and extract:
1. Entities: Important nodes such as:
   - "Equipment Tag" (e.g. P-101, PRV-204, Bearing, Housing)
   - "Parameter" (e.g. 150 psig, 75°C, 3000 rpm)
   - "Regulation" (e.g. API 510, Factory Act, OISD)
   - "Date" (e.g. March 2024)
   - "Personnel" (e.g. Maintenance Supervisor, Operator)
2. Relationships: Connections between the entities. For example:
   - "LOCATED_IN" (Equipment Tag located in location/area)
   - "REGULATES" (Regulation governs Equipment Tag or Parameter)
   - "REQUIRES_MAINTENANCE" (Equipment Tag requires a specific procedure)
   - "HAS_LIMIT" (Equipment Tag has operating parameter limit)
   - "FAILED_AT" (Equipment Tag failure event on Date/Time)

Provide your response ONLY as a valid JSON object matching the JSON schema below. Do not add any conversational text or markdown other than the JSON block.

JSON Schema format:
{{
  "entities": [
    {{
      "type": "Equipment Tag | Parameter | Regulation | Date | Personnel",
      "value": "Exact name or tag from text, e.g. P-101",
      "context": "Short text snippet containing this entity"
    }}
  ],
  "relationships": [
    {{
      "source_value": "Entity value, e.g. P-101",
      "target_value": "Entity value, e.g. Process Area",
      "type": "LOCATED_IN | REGULATES | REQUIRES_MAINTENANCE | HAS_LIMIT | FAILED_AT",
      "context": "Short text snippet showing the relation"
    }}
  ]
}}

Text to analyze:
<<<TEXT>>>
{text_content}
<<<END_TEXT>>>
"""

def extract_knowledge_graph(text_content: str) -> Dict[str, Any]:
    """Analyzes the page text content using LLM to extract entities and their relationships.
    
    Returns:
        {"entities": [...], "relationships": [...]}
    """
    if not text_content or not text_content.strip():
        return {"entities": [], "relationships": []}

    prompt = _KG_EXTRACTION_USER_PROMPT_TEMPLATE.format(text_content=text_content)
    try:
        response_text = generate_llm_response(
            prompt=prompt,
            system_prompt=_KG_EXTRACTION_SYSTEM_PROMPT,
            max_tokens=1024
        )
        
        # Clean up response to find JSON content (handles markdown fence ```json ... ``` blocks)
        json_match = re.search(r"({.*})", response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1).strip()
        else:
            json_str = response_text.strip()
            
        data = json.loads(json_str)
        
        # Validate keys existence
        if "entities" not in data:
            data["entities"] = []
        if "relationships" not in data:
            data["relationships"] = []
            
        return data
    except Exception as exc:
        logger.warning("Failed to extract knowledge graph using LLM: %s", exc)
        return {"entities": [], "relationships": []}
