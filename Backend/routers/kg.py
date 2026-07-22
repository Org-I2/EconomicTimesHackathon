import logging
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from Backend.database import get_db
from Backend.auth import get_current_user
from Backend import models
from Backend import schemas

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kg", tags=["Knowledge Graph"])

@router.get("/graph", response_model=schemas.GraphResponse)
def get_knowledge_graph(
    document_id: Optional[str] = Query(None, description="Filter graph by specific document ID"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fetches nodes (entities) and links (relationships) to feed directly
    into graph visualization libraries (e.g., D3.js, Vis.js).
    """
    entity_query = db.query(models.Entity)
    rel_query = db.query(models.EntityRelationship)

    if document_id:
        entity_query = entity_query.filter(models.Entity.document_id == document_id)
        # For relationships, join on Entity table to filter by document
        rel_query = rel_query.join(
            models.Entity,
            models.EntityRelationship.source_entity_id == models.Entity.id
        ).filter(models.Entity.document_id == document_id)

    entities = entity_query.all()
    relationships = rel_query.all()

    nodes = [
        schemas.GraphNode(
            id=str(ent.id),
            label=ent.entity_value,
            type=ent.entity_type
        )
        for ent in entities
    ]

    links = [
        schemas.GraphLink(
            source=str(rel.source_entity_id),
            target=str(rel.target_entity_id),
            type=rel.relationship_type
        )
        for rel in relationships
    ]

    return {
        "nodes": nodes,
        "links": links
    }

@router.get("/entities", response_model=List[schemas.EntityResponse])
def search_entities(
    q: Optional[str] = Query(None, description="Search term for entity value"),
    entity_type: Optional[str] = Query(None, description="Filter by Entity Type (e.g. Equipment Tag)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Entity)
    if q:
        query = query.filter(models.Entity.entity_value.ilike(f"%{q}%"))
    if entity_type:
        query = query.filter(models.Entity.entity_type == entity_type)

    # Return top 100 entities to prevent massive responses
    return query.limit(100).all()
