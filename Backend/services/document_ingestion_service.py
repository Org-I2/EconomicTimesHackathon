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
    """Extracts entities and relationships using the regex heuristics and saves them to PostgreSQL."""
    if not page_records:
        return

    from services.graph import extract_equipment_tags, extract_persons

    first_page = page_records[0]

    # 1. Create or get Document Entity (acts as the root node of the graph)
    doc_entity = db.query(models.Entity).filter(
        models.Entity.document_id == doc_db.id,
        models.Entity.entity_type == "Document",
        models.Entity.normalized_value == str(doc_db.id).lower()
    ).first()

    if not doc_entity:
        doc_entity = models.Entity(
            document_id=doc_db.id,
            page_id=first_page.id,
            entity_type="Document",
            entity_value=doc_db.filename,
            normalized_value=str(doc_db.id).lower(),
            context_snippet=f"Root Document Node: {doc_db.filename}"
        )
        db.add(doc_entity)
        db.flush()

    for page in page_records:
        if not page.text_content.strip():
            continue

        logger.info("Extracting Knowledge Graph for Document %s, Page %d via regex heuristics", doc_db.filename, page.page_number)
        
        tags = extract_equipment_tags(page.text_content)
        persons = extract_persons(page.text_content)

        # Save Equipment Entities and their relations
        for tag in tags:
            norm_val = tag.strip().upper()
            
            # Check unique constraint: (page_id, entity_type, normalized_value)
            entity = db.query(models.Entity).filter(
                models.Entity.page_id == page.id,
                models.Entity.entity_type == "Equipment",
                models.Entity.normalized_value == norm_val
            ).first()
            
            if not entity:
                entity = models.Entity(
                    document_id=doc_db.id,
                    page_id=page.id,
                    entity_type="Equipment",
                    entity_value=tag.strip(),
                    normalized_value=norm_val,
                    context_snippet=f"Mentioned in page {page.page_number}"
                )
                db.add(entity)
                db.flush()
                
            # Create MENTIONED_IN relation from Equipment to Document
            rel1 = db.query(models.EntityRelationship).filter(
                models.EntityRelationship.source_entity_id == entity.id,
                models.EntityRelationship.target_entity_id == doc_entity.id,
                models.EntityRelationship.relationship_type == "MENTIONED_IN"
            ).first()
            if not rel1:
                rel1 = models.EntityRelationship(
                    source_entity_id=entity.id,
                    target_entity_id=doc_entity.id,
                    relationship_type="MENTIONED_IN",
                    context_snippet=f"Equipment {tag} mentioned in document"
                )
                db.add(rel1)
                
            # Create HAS_INCIDENT relation if document is Incident Report
            if doc_db.doc_type == "Incident Report":
                rel2 = db.query(models.EntityRelationship).filter(
                    models.EntityRelationship.source_entity_id == entity.id,
                    models.EntityRelationship.target_entity_id == doc_entity.id,
                    models.EntityRelationship.relationship_type == "HAS_INCIDENT"
                ).first()
                if not rel2:
                    rel2 = models.EntityRelationship(
                        source_entity_id=entity.id,
                        target_entity_id=doc_entity.id,
                        relationship_type="HAS_INCIDENT",
                        context_snippet=f"Incident reported on equipment {tag}"
                    )
                    db.add(rel2)

        # Save Person Entities and their relations
        for person in persons:
            norm_val = person.strip().upper()
            
            # Check unique constraint: (page_id, entity_type, normalized_value)
            entity = db.query(models.Entity).filter(
                models.Entity.page_id == page.id,
                models.Entity.entity_type == "Person",
                models.Entity.normalized_value == norm_val
            ).first()
            
            if not entity:
                entity = models.Entity(
                    document_id=doc_db.id,
                    page_id=page.id,
                    entity_type="Person",
                    entity_value=person.strip(),
                    normalized_value=norm_val,
                    context_snippet=f"Mentioned in page {page.page_number}"
                )
                db.add(entity)
                db.flush()
                
            # Create MENTIONED_IN relation from Person to Document
            rel = db.query(models.EntityRelationship).filter(
                models.EntityRelationship.source_entity_id == entity.id,
                models.EntityRelationship.target_entity_id == doc_entity.id,
                models.EntityRelationship.relationship_type == "MENTIONED_IN"
            ).first()
            if not rel:
                rel = models.EntityRelationship(
                    source_entity_id=entity.id,
                    target_entity_id=doc_entity.id,
                    relationship_type="MENTIONED_IN",
                    context_snippet=f"Person {person} mentioned in document"
                )
                db.add(rel)

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
