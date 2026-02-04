from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from ....models.schemas import JobStatus
from ....services.job_manager import job_manager
from ....config import settings

router = APIRouter()


@router.get("/download/{job_id}/{image_id}")
async def download_image(job_id: str, image_id: str):
    """Download a processed image."""

    # Get the job
    job = job_manager.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )

    # Get the image
    image = job.images.get(image_id)

    if not image:
        raise HTTPException(
            status_code=404,
            detail=f"Image not found: {image_id}"
        )

    # Check if processing is complete
    if image.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Image not ready. Status: {image.status}"
        )

    # Find the processed file
    processed_dir = settings.processed_dir / job_id

    if not processed_dir.exists():
        raise HTTPException(
            status_code=404,
            detail="Processed file not found"
        )

    # Get the output filename (PNG)
    base_name = Path(image.original_filename).stem
    output_filename = f"{base_name}.png"
    file_path = processed_dir / output_filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Processed file not found"
        )

    return FileResponse(
        path=str(file_path),
        media_type="image/png",
        filename=output_filename
    )
