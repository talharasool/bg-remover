from fastapi import APIRouter, HTTPException
from ....models.schemas import StatusResponse, JobStatus
from ....services.job_manager import job_manager

router = APIRouter()


@router.get("/status/{job_id}", response_model=StatusResponse)
async def get_job_status(job_id: str):
    """Get the status of a processing job."""

    job = job_manager.get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )

    return StatusResponse(
        job_id=job.job_id,
        status=job.status,
        progress=job.progress,
        images=list(job.images.values()),
        completed_count=job.completed_count,
        total_count=job.total_count
    )
