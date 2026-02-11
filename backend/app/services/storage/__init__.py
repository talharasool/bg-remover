"""Storage backends — local filesystem and Cloudflare R2."""

from ...config import settings
from .base import StorageBackend
from .local import LocalStorage


def get_storage() -> StorageBackend:
    """Return the configured storage backend."""
    if settings.storage_backend == "r2":
        from .r2 import R2Storage

        return R2Storage()
    return LocalStorage()
