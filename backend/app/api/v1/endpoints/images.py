from fastapi import APIRouter, Depends, File, Request, UploadFile

from ....middleware.api_key_auth import check_batch_allowed, optional_api_key
from ....middleware.rate_limit import limiter
from ....models.api_key import ApiKey
from ....models.schemas import UploadResponse
from ....services.job_manager import job_manager
from ....services.storage.local import storage
from ....tasks.worker import process_batch_task, process_image_task
from ....utils.validators import validate_batch, validate_image

router = APIRouter()


@router.post("/remove-bg", response_model=UploadResponse)
@limiter.limit("10/minute")
async def remove_background(
    request: Request,
    file: UploadFile = File(...),
    api_key: ApiKey | None = Depends(optional_api_key),
) -> UploadResponse:
    """Upload a single image for background removal."""

    # Validate the image
    content = await validate_image(file)

    filename = file.filename or "upload.jpg"

    # Create a job
    job = job_manager.create_job([{"filename": filename}])

    # Get the image ID from the job
    image_id = list(job.images.keys())[0]

    # Save original file
    original_path = await storage.save_original(content, filename, job.job_id)

    # Enqueue processing task via Huey
    process_image_task(job.job_id, image_id, original_path, filename)

    return UploadResponse(job_id=job.job_id, message="Image uploaded successfully. Processing started.", total_images=1)


@router.post("/remove-bg/batch", response_model=UploadResponse)
@limiter.limit("5/minute")
async def remove_background_batch(
    request: Request,
    files: list[UploadFile] = File(...),
    api_key: ApiKey | None = Depends(optional_api_key),
) -> UploadResponse:
    """Upload multiple images for background removal (max 20)."""

    # Check if batch is allowed for this tier
    check_batch_allowed(api_key)

    # Validate all files
    validated_files = await validate_batch(files)

    # Create a job with all files
    images_info = [{"filename": f.filename or "upload.jpg"} for f, _ in validated_files]
    job = job_manager.create_job(images_info)

    # Prepare batch processing data
    batch_data = []
    image_ids = list(job.images.keys())

    for i, (file, content) in enumerate(validated_files):
        image_id = image_ids[i]
        filename = file.filename or "upload.jpg"

        # Save original file
        original_path = await storage.save_original(content, filename, job.job_id)

        batch_data.append({"image_id": image_id, "original_path": original_path, "filename": filename})

    # Enqueue batch processing task via Huey
    process_batch_task(job.job_id, batch_data)

    return UploadResponse(
        job_id=job.job_id,
        message=f"{len(validated_files)} images uploaded successfully. Processing started.",
        total_images=len(validated_files),
    )
