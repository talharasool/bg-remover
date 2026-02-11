"""Background task definitions for Huey worker."""

import asyncio
from typing import Any

from ..models.schemas import JobStatus
from ..services.job_manager import job_manager
from ..services.storage.local import storage
from .queue import huey

# Lazy-loaded rembg session (heavy import, only load in worker process)
_rembg_session: Any = None


def _get_session() -> Any:
    global _rembg_session
    if _rembg_session is None:
        from rembg import new_session

        _rembg_session = new_session("birefnet-general")
    return _rembg_session


def _run_async(coro: Any) -> Any:
    """Run an async coroutine from sync Huey worker context."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@huey.task()
def process_image_task(job_id: str, image_id: str, original_path: str, original_filename: str) -> str:
    """Process a single image: remove background and save result.

    Runs synchronously inside the Huey worker process.
    """
    from rembg import remove

    try:
        job_manager.update_image_status(job_id, image_id, JobStatus.PROCESSING)

        image_data = _run_async(storage.get_file(original_path))
        if not image_data:
            raise ValueError("Original image not found")

        session = _get_session()
        processed_data: bytes = remove(image_data, session=session)

        processed_path: str = _run_async(storage.save_processed(processed_data, original_filename, job_id))

        download_url = f"/api/v1/download/{job_id}/{image_id}"
        job_manager.update_image_status(job_id, image_id, JobStatus.COMPLETED, download_url=download_url)

        return processed_path

    except Exception as e:
        job_manager.update_image_status(job_id, image_id, JobStatus.FAILED, error=str(e))
        raise


@huey.task()
def process_batch_task(job_id: str, images: list[dict]) -> None:
    """Process all images in a batch sequentially inside the worker."""
    for img in images:
        process_image_task.call_local(
            job_id=job_id,
            image_id=img["image_id"],
            original_path=img["original_path"],
            original_filename=img["filename"],
        )
