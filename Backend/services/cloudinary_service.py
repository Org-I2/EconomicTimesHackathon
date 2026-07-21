import uuid
import logging
import cloudinary
import cloudinary.uploader
from Backend import config

logger = logging.getLogger(__name__)

# Initialize Cloudinary credentials
cloudinary.config(
    cloud_name=config.CLOUDINARY_CLOUD_NAME,
    api_key=config.CLOUDINARY_API_KEY,
    api_secret=config.CLOUDINARY_API_SECRET,
    secure=True
)

def upload_document(file_bytes: bytes, filename: str) -> dict:
    """Uploads document bytes to Cloudinary as a raw resource.
    
    Returns:
        A dict containing:
        {
            "secure_url": str,
            "public_id": str
        }
    """
    if not config.CLOUDINARY_CLOUD_NAME or not config.CLOUDINARY_API_KEY:
        raise ValueError("Cloudinary credentials are not configured in the environment.")

    # Generate a unique path/public_id for the file to prevent collisions
    unique_id = uuid.uuid4().hex
    # Sanitize filename (remove non-alphanumeric, keep dots and underscores)
    clean_filename = "".join(c for c in filename if c.isalnum() or c in (".", "_", "-")).strip()
    public_id = f"industrial_brain/{unique_id}_{clean_filename}"

    logger.info("Uploading file %s to Cloudinary as public_id %s", filename, public_id)
    
    # Uploading as resource_type="raw" is required for non-image/non-video files (like PDF, TXT)
    response = cloudinary.uploader.upload(
        file_bytes,
        public_id=public_id,
        resource_type="raw"
    )

    return {
        "secure_url": response["secure_url"],
        "public_id": response["public_id"]
    }

def delete_document(public_id: str) -> None:
    """Deletes a raw resource from Cloudinary."""
    if not public_id:
        return

    logger.info("Deleting public_id %s from Cloudinary", public_id)
    
    response = cloudinary.uploader.destroy(
        public_id,
        resource_type="raw"
    )
    
    if response.get("result") != "ok":
        logger.warning("Cloudinary delete result for %s was: %s", public_id, response)
