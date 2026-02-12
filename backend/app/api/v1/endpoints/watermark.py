from fastapi import APIRouter, Depends, File, Request, UploadFile

from ....middleware.api_key_auth import optional_api_key
from ....middleware.rate_limit import limiter
from ....models.api_key import ApiKey
from ....models.schemas import UploadResponse
from ....services.job_manager import job_manager
from ....services.storage.local import storage
from ....tasks.worker import remove_watermark_task
from ....utils.validators import validate_image

router = APIRouter()


@router.post("/remove-watermark", response_model=UploadResponse)
@limiter.limit("10/minute")
async def remove_watermark(
    request: Request,
    file: UploadFile = File(...),
    api_key: ApiKey | None = Depends(optional_api_key),
) -> UploadResponse:
    """Upload a single image for watermark removal."""

    content = await validate_image(file)

    filename = file.filename or "upload.png"

    job = job_manager.create_job([{"filename": filename}])

    image_id = list(job.images.keys())[0]

    original_path = await storage.save_original(content, filename, job.job_id)

    remove_watermark_task(job.job_id, image_id, original_path, filename)

    return UploadResponse(
        job_id=job.job_id,
        message="Image uploaded successfully. Watermark removal started.",
        total_images=1,
    )
