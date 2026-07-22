import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 1. Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Add 'ml' directory to sys.path so its modules (core, services) can be imported
ml_dir = str(BASE_DIR / "ml")
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

# Load workspace .env if it exists
load_dotenv()

# We MUST override settings in core.config BEFORE importing other ml.services
from core.config import settings


# 2. Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/industrial_brain"
)

# 3. Authentication settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-industrial-brain-hackathon-2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # Default 24 hours

# 4. Cloudinary Configuration
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

# 5. ChromaDB Absolute Configurable Path
raw_chroma_dir = os.getenv("CHROMA_PERSIST_DIR")
if not raw_chroma_dir or not raw_chroma_dir.strip():
    CHROMA_PERSIST_DIR = str(BASE_DIR / "data" / "chroma")
else:
    CHROMA_PERSIST_DIR = raw_chroma_dir

# Ensure the directory exists
Path(CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)

# Override the core settings using object.__setattr__ since the dataclass is frozen
object.__setattr__(settings, "vector_store_persist_dir", CHROMA_PERSIST_DIR)

# 6. Upload Processing Mode
# Can be "background" (uses FastAPI BackgroundTasks) or "inline" (synchronous)
UPLOAD_PROCESSING_MODE = os.getenv("UPLOAD_PROCESSING_MODE", "background").lower()

print(f"[Config] Configured Chroma persist directory: {settings.vector_store_persist_dir}")
