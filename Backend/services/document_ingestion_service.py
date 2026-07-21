import os
import uuid
import logging
import tempfile
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from Backend import models
from Backend.services import ml_adapter

logger = logging.getLogger(__name__)

def parse_and_extract_pages(file_bytes: bytes, filename: str, temp_dir: str) -> list[dict]:
    """Extracts page text from PDF, Image, or Text files.
    Uses native PDF text extraction with OCR fallback for scanned pages.
    
    Returns:
        A list of dicts: [{"page_number": int, "text": str, "ocr_confidence": float}]
    """
    ext = os.path.splitext(filename.lower())[1]
    
    pages = []
    
    if ext == ".pdf":
        import fitz  # PyMuPDF
        
        # Save bytes to a temporary file since fitz and existing OCR require a file path
        temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}.pdf")
        with open(temp_file_path, "wb") as f:
            f.write(file_bytes)
            
        try:
            doc = fitz.open(temp_file_path)
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                text = page.get_text().strip()
                
                # If digital text extraction is empty or too short, fallback to OCR
                if len(text) < 20:
                    logger.info("Page %d of %s has no text layer. Falling back to OCR.", page_num + 1, filename)
                    try:
                        ocr_result = ml_adapter.extract_text_from_pdf_page(temp_file_path, page_num)
                        pages.append({
                            "page_number": page_num + 1,
                            "text": ocr_result["text"],
                            "ocr_confidence": ocr_result["average_confidence"]
                        })
                    except Exception as ocr_exc:
                        logger.error("OCR fallback failed on page %d: %s", page_num + 1, ocr_exc)
                        # Fallback to empty text with 0.0 confidence
                        pages.append({
                            "page_number": page_num + 1,
                            "text": "",
                            "ocr_confidence": 0.0
                        })
                else:
                    pages.append({
                        "page_number": page_num + 1,
                        "text": text,
                        "ocr_confidence": 1.0  # digital text is 100% confidence
                    })
            doc.close()
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
    elif ext in (".png", ".jpg", ".jpeg", ".bmp", ".tiff"):
        # Single page image
        try:
            ocr_result = ml_adapter.extract_text_from_image(file_bytes)
            pages.append({
                "page_number": 1,
                "text": ocr_result["text"],
                "ocr_confidence": ocr_result["average_confidence"]
            })
        except Exception as ocr_exc:
            logger.error("Image OCR failed: %s", ocr_exc)
            pages.append({
                "page_number": 1,
                "text": "",
                "ocr_confidence": 0.0
            })
            
    else:
        # Fallback to treating as a plain text file
        try:
            text = file_bytes.decode("utf-8", errors="ignore").strip()
            pages.append({
                "page_number": 1,
                "text": text,
                "ocr_confidence": 1.0
            })
        except Exception as exc:
            logger.error("Text file decoding failed: %s", exc)
            pages.append({
                "page_number": 1,
                "text": "",
                "ocr_confidence": 0.0
            })
            
    return pages

def save_knowledge_graph(db: Session, doc_db: models.Document, page_records: list[models.Page]):
    """Extracts entities and relationships using the LLM adapter and saves them to PostgreSQL."""
    # Maps entity_value -> Entity database record to resolve relationship links
    entity_cache = {}

    for page in page_records:
        if not page.text_content.strip():
            continue
            
        logger.info("Extracting Knowledge Graph for Document %s, Page %d", doc_db.filename, page.page_number)
        kg_data = ml_adapter.extract_knowledge_graph(page.text_content)
        
        # Save Entities
        for ent in kg_data.get("entities", []):
            val = ent.get("value", "").strip()
            etype = ent.get("type", "").strip()
            if not val or not etype:
                continue
                
            norm_val = val.lower()
            
            # Check unique constraint: (page_id, entity_type, normalized_value)
            existing_entity = db.query(models.Entity).filter(
                models.Entity.page_id == page.id,
                models.Entity.entity_type == etype,
                models.Entity.normalized_value == norm_val
            ).first()
            
            if existing_entity:
                entity_cache[(page.id, etype, norm_val)] = existing_entity
                continue
                
            db_entity = models.Entity(
                document_id=doc_db.id,
                page_id=page.id,
                entity_type=etype,
                entity_value=val,
                normalized_value=norm_val,
                context_snippet=ent.get("context")
            )
            db.add(db_entity)
            db.flush()  # populate ID
            entity_cache[(page.id, etype, norm_val)] = db_entity

        # Save Relationships
        for rel in kg_data.get("relationships", []):
            s_val = rel.get("source_value", "").strip()
            t_val = rel.get("target_value", "").strip()
            rtype = rel.get("type", "").strip()
            
            if not s_val or not t_val or not rtype:
                continue
                
            # Find matching entity records on this page
            s_entity = None
            t_entity = None
            
            # Simple matching on normalized name values
            s_norm = s_val.lower()
            t_norm = t_val.lower()
            
            for (pid, etype, norm_val), entity_obj in entity_cache.items():
                if pid == page.id:
                    if norm_val == s_norm:
                        s_entity = entity_obj
                    if norm_val == t_norm:
                        t_entity = entity_obj
            
            # If not found in cache, do a DB check for entities on this page
            if not s_entity:
                s_entity = db.query(models.Entity).filter(
                    models.Entity.page_id == page.id,
                    models.Entity.normalized_value == s_norm
                ).first()
            if not t_entity:
                t_entity = db.query(models.Entity).filter(
                    models.Entity.page_id == page.id,
                    models.Entity.normalized_value == t_norm
                ).first()
                
            if s_entity and t_entity:
                # Check uniqueness constraint: (source_entity_id, target_entity_id, relationship_type)
                existing_rel = db.query(models.EntityRelationship).filter(
                    models.EntityRelationship.source_entity_id == s_entity.id,
                    models.EntityRelationship.target_entity_id == t_entity.id,
                    models.EntityRelationship.relationship_type == rtype
                ).first()
                
                if not existing_rel:
                    db_rel = models.EntityRelationship(
                        source_entity_id=s_entity.id,
                        target_entity_id=t_entity.id,
                        relationship_type=rtype,
                        context_snippet=rel.get("context")
                    )
                    db.add(db_rel)

def ingest_document_pipeline(db: Session, document_id: str, file_bytes: bytes):
    """Orchestrates the synchronous ingestion pipeline. Called in background tasks."""
    doc_db = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc_db:
        logger.error("Document with ID %s not found in database.", document_id)
        return
        
    logger.info("Starting background ingestion for document %s (ID: %s)", doc_db.filename, document_id)
    
    # 1. Update Status to PROCESSING
    doc_db.status = models.DocumentStatus.PROCESSING
    doc_db.processing_started_at = datetime.utcnow()
    doc_db.processing_error = None
    db.commit()
    
    # Create temp workspace directory for PDF rasterization
    temp_dir = tempfile.mkdtemp(prefix="ind_brain_")
    
    try:
        # 2. Extract Text Pages (digital or OCR fallback)
        pages_data = parse_and_extract_pages(file_bytes, doc_db.filename, temp_dir)
        
        if not pages_data:
            raise ValueError("No pages or text could be extracted from this document.")
            
        # 3. Store Pages in PostgreSQL
        page_records = []
        for p in pages_data:
            page_db = models.Page(
                document_id=doc_db.id,
                page_number=p["page_number"],
                text_content=p["text"],
                ocr_confidence=p["ocr_confidence"]
            )
            db.add(page_db)
            page_records.append(page_db)
        db.flush()  # Generates page UUIDs
        
        # 4. Extract and Save Knowledge Graph in PostgreSQL
        save_knowledge_graph(db, doc_db, page_records)
        
        # 5. Index chunks and embeddings in Vector Store (ChromaDB)
        ml_pages = [{"page_number": p.page_number, "text": p.text_content} for p in page_records]
        logger.info("Indexing vector embeddings for document ID %s in ChromaDB", document_id)
        total_chunks = ml_adapter.process_and_index_document(
            document_id=str(doc_db.id),
            pages=ml_pages,
            filename=doc_db.filename
        )
        
        # 6. Compute Average OCR Confidence
        valid_confidences = [p["ocr_confidence"] for p in pages_data if p["ocr_confidence"] is not None]
        avg_confidence = sum(valid_confidences) / len(valid_confidences) if valid_confidences else 1.0
        
        # 7. Update Status to COMPLETED
        doc_db.status = models.DocumentStatus.COMPLETED
        doc_db.ocr_confidence = avg_confidence
        doc_db.total_chunks = total_chunks
        doc_db.processing_completed_at = datetime.utcnow()
        db.commit()
        logger.info("Successfully ingested document %s (ID: %s)", doc_db.filename, document_id)
        
    except Exception as exc:
        db.rollback()
        logger.error("Ingestion failed for document %s (ID: %s): %s", doc_db.filename, document_id, exc, exc_info=True)
        
        # Safe failure handler: Keep Postgres record, set status to FAILED, record error
        doc_db = db.query(models.Document).filter(models.Document.id == document_id).first()
        if doc_db:
            doc_db.status = models.DocumentStatus.FAILED
            doc_db.processing_error = str(exc)
            doc_db.processing_completed_at = datetime.utcnow()
            db.commit()
            
    finally:
        # Clean up temporary directory
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except Exception as e:
            logger.warning("Failed to clean up temp dir %s: %s", temp_dir, e)
