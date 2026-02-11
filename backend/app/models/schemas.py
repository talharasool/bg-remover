from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class JobStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ImageResult(BaseModel):
    image_id: str
    original_filename: str
    status: JobStatus
    download_url: str | None = None
    error: str | None = None


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    created_at: datetime
    images: list[ImageResult]
    completed_count: int = 0
    total_count: int = 0


class UploadResponse(BaseModel):
    job_id: str
    message: str
    total_images: int


class StatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: float
    images: list[ImageResult]
    completed_count: int
    total_count: int


class ErrorResponse(BaseModel):
    detail: str
