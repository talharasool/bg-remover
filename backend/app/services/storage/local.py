import aiofiles
import os
from pathlib import Path
from .base import StorageBackend
from ...config import settings


class LocalStorage(StorageBackend):
    """Local filesystem storage backend."""

    def __init__(self):
        self.original_dir = settings.original_dir
        self.processed_dir = settings.processed_dir
        self._ensure_dirs()

    def _ensure_dirs(self):
        """Ensure storage directories exist."""
        self.original_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    async def save_original(self, file_content: bytes, filename: str, job_id: str) -> str:
        """Save original uploaded file."""
        job_dir = self.original_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        file_path = job_dir / filename
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)

        return str(file_path)

    async def save_processed(self, file_content: bytes, filename: str, job_id: str) -> str:
        """Save processed file."""
        job_dir = self.processed_dir / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        # Always save as PNG for transparency
        base_name = Path(filename).stem
        output_filename = f"{base_name}.png"
        file_path = job_dir / output_filename

        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)

        return str(file_path)

    async def get_file(self, path: str) -> bytes | None:
        """Retrieve file content by path."""
        file_path = Path(path)
        if not file_path.exists():
            return None

        async with aiofiles.open(file_path, 'rb') as f:
            return await f.read()

    async def delete_file(self, path: str) -> bool:
        """Delete a file by path."""
        file_path = Path(path)
        if file_path.exists():
            os.remove(file_path)
            return True
        return False

    async def list_files(self, prefix: str = "") -> list[str]:
        """List all files with optional prefix filter."""
        files = []
        base_dir = settings.upload_dir

        for root, _, filenames in os.walk(base_dir):
            for filename in filenames:
                file_path = os.path.join(root, filename)
                if prefix and not file_path.startswith(prefix):
                    continue
                files.append(file_path)

        return files

    async def get_file_path(self, path: str) -> Path | None:
        """Get the actual file path for streaming."""
        file_path = Path(path)
        if file_path.exists():
            return file_path
        return None


# Singleton instance
storage = LocalStorage()
