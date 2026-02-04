import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from ..config import settings
from ..services.job_manager import job_manager


def cleanup_old_files():
    """Remove files older than retention period."""
    cutoff = datetime.utcnow() - timedelta(hours=settings.retention_hours)
    deleted_count = 0

    # Cleanup original files
    deleted_count += _cleanup_directory(settings.original_dir, cutoff)

    # Cleanup processed files
    deleted_count += _cleanup_directory(settings.processed_dir, cutoff)

    # Cleanup job manager
    jobs_deleted = job_manager.cleanup_old_jobs(settings.retention_hours)

    return {
        "files_deleted": deleted_count,
        "jobs_deleted": jobs_deleted
    }


def _cleanup_directory(directory: Path, cutoff: datetime) -> int:
    """Remove old files and empty directories from a directory."""
    deleted_count = 0

    if not directory.exists():
        return 0

    # Walk through job directories
    for job_dir in directory.iterdir():
        if not job_dir.is_dir():
            continue

        # Check directory modification time
        dir_mtime = datetime.fromtimestamp(job_dir.stat().st_mtime)

        if dir_mtime < cutoff:
            # Remove entire job directory
            try:
                shutil.rmtree(job_dir)
                deleted_count += 1
            except Exception as e:
                print(f"Error deleting {job_dir}: {e}")

    return deleted_count


def get_storage_stats() -> dict:
    """Get storage statistics."""
    original_size = _get_directory_size(settings.original_dir)
    processed_size = _get_directory_size(settings.processed_dir)

    return {
        "original_files_size_mb": round(original_size / (1024 * 1024), 2),
        "processed_files_size_mb": round(processed_size / (1024 * 1024), 2),
        "total_size_mb": round((original_size + processed_size) / (1024 * 1024), 2),
        "jobs_count": len(job_manager.get_all_jobs())
    }


def _get_directory_size(directory: Path) -> int:
    """Get total size of a directory in bytes."""
    if not directory.exists():
        return 0

    total = 0
    for path in directory.rglob('*'):
        if path.is_file():
            total += path.stat().st_size

    return total
