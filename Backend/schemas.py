from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any
from Backend.models import UserRole, DocumentStatus, ChatRole

# --- User & Auth Schemas ---

class UserSignUp(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.OPERATOR


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# --- Document Schemas ---

class DocumentResponse(BaseModel):
    id: UUID
    filename: str
    file_url: str
    doc_type: str
    status: DocumentStatus
    ocr_confidence: Optional[float]
    processing_error: Optional[str]
    total_chunks: Optional[int] = None  # converted internally or int
    uploaded_at: datetime

    class Config:
        from_attributes = True


class PageResponse(BaseModel):
    id: UUID
    page_number: int
    text_content: str
    ocr_confidence: Optional[float]

    class Config:
        from_attributes = True


class EntityResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_value: str
    context_snippet: Optional[str]

    class Config:
        from_attributes = True


class DocumentDetailResponse(BaseModel):
    id: UUID
    filename: str
    file_url: str
    doc_type: str
    status: DocumentStatus
    ocr_confidence: Optional[float]
    processing_error: Optional[str]
    pages: List[PageResponse]
    entities: List[EntityResponse]

    class Config:
        from_attributes = True


# --- Copilot / RAG Schemas ---

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[UUID] = None


class CitationSchema(BaseModel):
    document_id: str
    filename: str
    page_number: int
    chunk_id: str


class QueryResponse(BaseModel):
    answer: str
    confidence: float
    citations: List[CitationSchema]
    session_id: UUID


class ChatSessionResponse(BaseModel):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: UUID
    role: ChatRole
    content: str
    confidence: Optional[float]
    citations: Optional[List[Dict[str, Any]]]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Knowledge Graph Schemas ---

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # e.g., Equipment Tag, Parameter, Regulation


class GraphLink(BaseModel):
    source: str
    target: str
    type: str  # e.g. LOCATED_IN, REGULATES


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]


# --- Specialized Agent Schemas ---

class RCARequest(BaseModel):
    equipment_tag: str


class RCAResponse(BaseModel):
    equipment_tag: str
    rca_report: str


class GapDetail(BaseModel):
    description: str
    severity: str  # e.g. High, Medium, Low
    section: Optional[str] = None


class ComplianceRequest(BaseModel):
    regulation: str  # e.g., Factory Act, OISD


class ComplianceResponse(BaseModel):
    regulation: str
    status: str  # e.g., COMPLIANT, NON_COMPLIANT, DEGRADED
    gaps: List[GapDetail]
