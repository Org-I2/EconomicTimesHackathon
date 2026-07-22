import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from Backend.database import get_db
from Backend.auth import get_current_user
from Backend import models
from Backend import schemas
from Backend.services import ml_adapter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/copilot", tags=["Copilot Chat"])

@router.post("/query", response_model=schemas.QueryResponse)
def query_copilot(
    query_in: schemas.QueryRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Resolve Session ID (or create a new session)
    if query_in.session_id:
        session = db.query(models.ChatSession).filter(
            models.ChatSession.id == query_in.session_id,
            models.ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found or does not belong to current user."
            )
    else:
        # Create new chat session
        session = models.ChatSession(user_id=current_user.id)
        db.add(session)
        db.commit()
        db.refresh(session)

    # 2. Retrieve Conversation History
    history_records = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session.id
    ).order_by(models.ChatMessage.created_at.asc()).all()

    # Format history for teammate-owned RAG
    # Format required: [{"role": "user" | "assistant", "content": str}, ...]
    conversation_history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in history_records
    ]

    # 3. Call the RAG Pipeline Adapter
    logger.info("Querying Copilot: '%s' in session: %s", query_in.query, session.id)
    try:
        rag_result = ml_adapter.answer_query(
            query=query_in.query,
            conversation_history=conversation_history
        )
    except Exception as exc:
        logger.error("RAG pipeline failed for query: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing retrieval-augmented generation: {str(exc)}"
        )

    # 4. Save User Query to chat logs
    user_msg = models.ChatMessage(
        session_id=session.id,
        role=models.ChatRole.USER,
        content=query_in.query
    )
    db.add(user_msg)

    # 5. Save Assistant Answer to chat logs (including confidence and citations)
    assistant_msg = models.ChatMessage(
        session_id=session.id,
        role=models.ChatRole.ASSISTANT,
        content=rag_result["answer"],
        confidence=rag_result["confidence"],
        citations=rag_result["citations"]
    )
    db.add(assistant_msg)
    
    # 6. Log activity
    audit = models.AuditLog(
        user_id=current_user.id,
        action="QUERY_COPILOT",
        details={
            "query": query_in.query[:100],
            "session_id": str(session.id),
            "confidence": rag_result["confidence"],
            "citation_count": len(rag_result["citations"])
        }
    )
    db.add(audit)
    
    db.commit()

    return {
        "answer": rag_result["answer"],
        "confidence": rag_result["confidence"],
        "citations": rag_result["citations"],
        "session_id": session.id
    }

@router.get("/sessions", response_model=List[schemas.ChatSessionResponse])
def get_user_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.ChatSession).filter(
        models.ChatSession.user_id == current_user.id
    ).order_by(models.ChatSession.created_at.desc()).all()

@router.get("/sessions/{session_id}/history", response_model=List[schemas.ChatMessageResponse])
def get_session_history(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )

    return db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).order_by(models.ChatMessage.created_at.asc()).all()
