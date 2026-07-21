import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add parent directory of Backend/ to sys.path so Backend and ml imports work
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from Backend.config import CHROMA_PERSIST_DIR, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY
from Backend.database import get_db, engine, Base
from Backend.routers import auth, documents, copilot, kg, agents
from Backend.services import ml_adapter

# Set up logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("Backend")

# --- Startup Health Check Routine ---

def perform_startup_checks(db: Session) -> dict:
    """Verifies external system configurations and status."""
    health_results = {
        "postgres": False,
        "cloudinary": False,
        "chromadb": False,
        "ml_model": False,
        "llm_provider": False,
        "status": "healthy"
    }

    # 1. Verify PostgreSQL Connectivity
    try:
        db.execute(text("SELECT 1"))
        health_results["postgres"] = True
    except Exception as exc:
        logger.error("Health Check: PostgreSQL database connectivity failed: %s", exc)
        health_results["status"] = "unhealthy"

    # 2. Verify Cloudinary Configuration
    if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY:
        health_results["cloudinary"] = True
    else:
        logger.warning("Health Check: Cloudinary credentials are not fully configured.")
        health_results["status"] = "degraded"

    # 3. Verify ChromaDB Directory Accessibility
    if CHROMA_PERSIST_DIR and os.path.exists(CHROMA_PERSIST_DIR) and os.access(CHROMA_PERSIST_DIR, os.W_OK):
        health_results["chromadb"] = True
    else:
        logger.error("Health Check: ChromaDB persist path is not writable or doesn't exist.")
        health_results["status"] = "unhealthy"

    # 4. Verify ML Embedding Model availability
    try:
        # A simple embed test to see if the sentence-transformer model is ready
        test_vec = ml_adapter.embed_text("health check")
        if len(test_vec) > 0:
            health_results["ml_model"] = True
    except Exception as exc:
        logger.error("Health Check: ML embedding model initialization failed: %s", exc)
        health_results["status"] = "unhealthy"

    # 5. Verify LLM Provider availability
    try:
        is_llm_ready = ml_adapter.check_llm_availability()
        if is_llm_ready:
            health_results["llm_provider"] = True
        else:
            logger.warning("Health Check: Configured LLM provider is not responding. Operating in DEGRADED state.")
            if health_results["status"] == "healthy":
                health_results["status"] = "degraded"
    except Exception as exc:
        logger.warning("Health Check: LLM availability query crashed: %s", exc)
        if health_results["status"] == "healthy":
            health_results["status"] = "degraded"

    return health_results


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically for quick hackathon deployment
    # Note: Alembic migration is used for formal environment deployments.
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as exc:
        logger.error("Failed to initialize database tables: %s", exc)
        
    # Perform health check
    db = next(get_db())
    try:
        checks = perform_startup_checks(db)
        logger.info("Startup Health Checks completed: %s", checks)
    except Exception as exc:
        logger.critical("Startup Health Check routine crashed: %s", exc)
    finally:
        db.close()
        
    yield
    logger.info("Shutting down Backend Application...")


app = FastAPI(
    title="Industrial Knowledge Intelligence API",
    description="Unified API interface for document ingestion, RAG chat copilot, and knowledge graph extraction.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to production domains in staging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(copilot.router)
app.include_router(kg.router)
app.include_router(agents.router)

# Health Check Route
@app.get("/health", tags=["System"])
def get_health_status(db: Session = Depends(get_db)):
    """API endpoint to fetch detailed health states for external services."""
    checks = perform_startup_checks(db)
    if checks["status"] == "unhealthy":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"message": "System is unhealthy.", "checks": checks}
        )
    return checks

@app.get("/", tags=["System"])
def root():
    return {
        "message": "Industrial Knowledge Intelligence Platform Backend API is running.",
        "docs_url": "/docs"
    }
