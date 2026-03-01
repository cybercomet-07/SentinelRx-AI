"""
Cloudinary upload service for prescription images.
"""
import logging
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def upload_prescription_image(file_data: str | bytes, folder: str = "prescriptions") -> dict[str, Any] | None:
    """
    Upload prescription image (base64 data URL or bytes) to Cloudinary.
    Returns dict with url, public_id, etc. or None if upload fails.
    """
    settings = get_settings()
    if not settings.cloudinary_cloud_name or not settings.cloudinary_api_key or not settings.cloudinary_api_secret:
        logger.warning("Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET")
        return None

    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
        )

        result = cloudinary.uploader.upload(
            file_data,
            folder=folder,
            use_filename=True,
            unique_filename=True,
        )
        return result
    except Exception as e:
        logger.exception("Cloudinary upload failed: %s", e)
        return None
