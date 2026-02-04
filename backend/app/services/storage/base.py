from abc import ABC, abstractmethod
from pathlib import Path


class StorageBackend(ABC):
    """Abstract base class for storage backends."""

    @abstractmethod
    async def save_original(self, file_content: bytes, filename: str, job_id: str) -> str:
        """Save original uploaded file. Returns the storage path/key."""
        pass

    @abstractmethod
    async def save_processed(self, file_content: bytes, filename: str, job_id: str) -> str:
        """Save processed file. Returns the storage path/key."""
        pass

    @abstractmethod
    async def get_file(self, path: str) -> bytes | None:
        """Retrieve file content by path/key."""
        pass

    @abstractmethod
    async def delete_file(self, path: str) -> bool:
        """Delete a file by path/key."""
        pass

    @abstractmethod
    async def list_files(self, prefix: str = "") -> list[str]:
        """List all files with optional prefix filter."""
        pass

    @abstractmethod
    async def get_file_path(self, path: str) -> Path | None:
        """Get the actual file path for streaming. Returns None for non-local storage."""
        pass
