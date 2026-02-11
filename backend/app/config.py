import os
from pathlib import Path

from pydantic_settings import BaseSettings


def get_upload_base() -> Path:
    """Get upload directory - /app/uploads for Docker, ./uploads for local."""
    if os.path.exists("/app") and os.access("/app", os.W_OK):
        return Path("/app/uploads")
    return Path(__file__).parent.parent / "uploads"


class Settings(BaseSettings):
    # App settings
    app_name: str = "Background Remover API"
    debug: bool = False

    # File settings
    max_file_size: int = 20 * 1024 * 1024  # 20MB
    max_batch_size: int = 20
    max_resolution: int = 25_000_000  # 25 megapixels
    processing_timeout: int = 60  # seconds

    # Storage settings
    upload_dir: Path = get_upload_base()
    original_dir: Path = get_upload_base() / "original"
    processed_dir: Path = get_upload_base() / "processed"

    # Cleanup settings
    retention_hours: int = 24

    # CORS settings
    cors_origins: list[str] = ["http://localhost:3000", "http://frontend:3000", "http://192.168.100.176:3000", "*"]

    # Supported formats
    allowed_extensions: set[str] = {"jpg", "jpeg", "png", "webp"}
    allowed_content_types: set[str] = {"image/jpeg", "image/png", "image/webp"}

    # Storage backend: "local" or "r2"
    storage_backend: str = "local"

    # Cloudflare R2 settings (only used when storage_backend = "r2")
    r2_endpoint_url: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "clearcut"

    # Rate limiting
    rate_limit_default: str = "60/minute"

    class Config:
        env_file = ".env"


settings = Settings()
