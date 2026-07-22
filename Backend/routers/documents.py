import httpx
import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List

from Backend.database import get_db
from Backend.auth import get_current_user
from Backend import models
from Backend import schemas
from Backend.config import UPLOAD_PROCESSING_MODE
from Backend.services import cloudinary_service, ml_adapter
from Backend.services.document_ingestion_service import ingest_document_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=schemas.DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Read file bytes
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    # 2. Upload file to Cloudinary first
    try:
        cloudinary_result = cloudinary_service.upload_document(file_bytes, file.filename)
    except Exception as exc:
        logger.error("Cloudinary upload failed for %s: %s", file.filename, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload document to Cloudinary storage: {str(exc)}"
        )
        
    # 3. Create Document entry in PostgreSQL
    doc_db = models.Document(
        filename=file.filename,
        file_url=cloudinary_result["secure_url"],
        cloudinary_public_id=cloudinary_result["public_id"],
        doc_type=doc_type,
        file_size=file_size,
        mime_type=file.content_type,
        status=models.DocumentStatus.UPLOADED,
        uploaded_by=current_user.id
    )
    db.add(doc_db)
    db.commit()
    db.refresh(doc_db)
    
    document_id_str = str(doc_db.id)
    
    # 4. Trigger Ingestion Pipeline (background vs inline)
    if UPLOAD_PROCESSING_MODE == "background":
        background_tasks.add_task(ingest_document_pipeline, db, document_id_str, file_bytes)
        # Update state locally to PROCESSING since it has been queued
        doc_db.status = models.DocumentStatus.PROCESSING
        db.commit()
        db.refresh(doc_db)
    else:
        # Inline synchronous processing
        ingest_document_pipeline(db, document_id_str, file_bytes)
        db.refresh(doc_db)
        if doc_db.status == models.DocumentStatus.FAILED:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Document ingestion failed: {doc_db.processing_error}"
            )
            
    return doc_db

@router.post("/{id}/retry", response_model=schemas.DocumentResponse)
async def retry_document(
    id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc_db = db.query(models.Document).filter(models.Document.id == id).first()
    if not doc_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
        
    if doc_db.status != models.DocumentStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only failed documents can be retried. Current status is {doc_db.status}."
        )

    logger.info("Retrying ingestion for document ID %s", id)
    
    # Reset status to UPLOADED/PROCESSING
    doc_db.status = models.DocumentStatus.PROCESSING
    doc_db.processing_error = None
    db.commit()
    
    # 1. Download file bytes from Cloudinary URL
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(doc_db.file_url)
            if response.status_code != 200:
                raise ValueError(f"Cloudinary download returned status code {response.status_code}")
            file_bytes = response.content
    except Exception as exc:
        logger.error("Failed to download file from Cloudinary for retry: %s", exc)
        doc_db.status = models.DocumentStatus.FAILED
        doc_db.processing_error = f"Failed to retrieve file from Cloudinary for ingestion: {str(exc)}"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to retrieve file from Cloudinary to retry ingestion."
        )

    # 2. Trigger Ingestion Pipeline
    if UPLOAD_PROCESSING_MODE == "background":
        background_tasks.add_task(ingest_document_pipeline, db, str(doc_db.id), file_bytes)
    else:
        ingest_document_pipeline(db, str(doc_db.id), file_bytes)
        db.refresh(doc_db)
        if doc_db.status == models.DocumentStatus.FAILED:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Document ingestion failed: {doc_db.processing_error}"
            )
            
    return doc_db

@router.get("", response_model=List[schemas.DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Document).order_by(models.Document.uploaded_at.desc()).all()

@router.get("/{id}", response_model=schemas.DocumentDetailResponse)
def get_document_details(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc_db = db.query(models.Document).filter(models.Document.id == id).first()
    if not doc_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
        
    return doc_db

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc_db = db.query(models.Document).filter(models.Document.id == id).first()
    if not doc_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    failures = []
    
    # 1. Delete vector embeddings from ChromaDB
    try:
        ml_adapter.delete_vectors(str(doc_db.id))
    except Exception as exc:
        logger.error("Failed to delete vectors from ChromaDB for document %s: %s", id, exc)
        failures.append(f"ChromaDB: {str(exc)}")

    # 2. Delete file from Cloudinary
    if doc_db.cloudinary_public_id:
        try:
            cloudinary_service.delete_document(doc_db.cloudinary_public_id)
        except Exception as exc:
            logger.error("Failed to delete document from Cloudinary for document %s: %s", id, exc)
            failures.append(f"Cloudinary: {str(exc)}")

    # 3. Delete Document from PostgreSQL (foreign keys cascade deletes pages and entities)
    try:
        db.delete(doc_db)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to delete document from PostgreSQL for document %s: %s", id, exc)
        failures.append(f"PostgreSQL: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document from database: {str(exc)}"
        )

    # If partial failures occurred on external systems, report them in warnings
    if failures:
        logger.warning("Partial failures while deleting document %s: %s", id, ", ".join(failures))
        # Note: We still return 204 because the primary PostgreSQL record is successfully removed.
