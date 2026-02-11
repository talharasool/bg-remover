import uuid
from datetime import datetime

from ..models.schemas import ImageResult, JobResponse, JobStatus


class Job:
    """Represents a background removal job."""

    def __init__(self, job_id: str, images: list[dict]):
        self.job_id = job_id
        self.created_at = datetime.utcnow()
        self.status = JobStatus.PENDING
        self.images: dict[str, ImageResult] = {}

        for img in images:
            image_id = str(uuid.uuid4())
            self.images[image_id] = ImageResult(
                image_id=image_id, original_filename=img["filename"], status=JobStatus.PENDING
            )

    @property
    def completed_count(self) -> int:
        return sum(1 for img in self.images.values() if img.status in (JobStatus.COMPLETED, JobStatus.FAILED))

    @property
    def total_count(self) -> int:
        return len(self.images)

    @property
    def progress(self) -> float:
        if self.total_count == 0:
            return 0.0
        return self.completed_count / self.total_count

    def update_status(self) -> None:
        """Update overall job status based on image statuses."""
        if all(img.status == JobStatus.COMPLETED for img in self.images.values()):
            self.status = JobStatus.COMPLETED
        elif any(img.status == JobStatus.PROCESSING for img in self.images.values()):
            self.status = JobStatus.PROCESSING
        elif all(img.status == JobStatus.FAILED for img in self.images.values()):
            self.status = JobStatus.FAILED
        elif self.completed_count == self.total_count:
            self.status = JobStatus.COMPLETED

    def to_response(self) -> JobResponse:
        return JobResponse(
            job_id=self.job_id,
            status=self.status,
            created_at=self.created_at,
            images=list(self.images.values()),
            completed_count=self.completed_count,
            total_count=self.total_count,
        )


class JobManager:
    """In-memory job tracking manager."""

    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}

    def create_job(self, images: list[dict]) -> Job:
        """Create a new job with the given images."""
        job_id = str(uuid.uuid4())
        job = Job(job_id, images)
        self._jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Job | None:
        """Get a job by ID."""
        return self._jobs.get(job_id)

    def update_image_status(
        self, job_id: str, image_id: str, status: JobStatus, download_url: str | None = None, error: str | None = None
    ) -> None:
        """Update the status of a specific image in a job."""
        job = self._jobs.get(job_id)
        if job and image_id in job.images:
            job.images[image_id].status = status
            if download_url:
                job.images[image_id].download_url = download_url
            if error:
                job.images[image_id].error = error
            job.update_status()

    def delete_job(self, job_id: str) -> bool:
        """Delete a job by ID."""
        if job_id in self._jobs:
            del self._jobs[job_id]
            return True
        return False

    def get_all_jobs(self) -> list[Job]:
        """Get all jobs."""
        return list(self._jobs.values())

    def cleanup_old_jobs(self, max_age_hours: int = 24) -> int:
        """Remove jobs older than max_age_hours."""
        now = datetime.utcnow()
        to_delete = []

        for job_id, job in self._jobs.items():
            age = (now - job.created_at).total_seconds() / 3600
            if age > max_age_hours:
                to_delete.append(job_id)

        for job_id in to_delete:
            del self._jobs[job_id]

        return len(to_delete)


# Singleton instance
job_manager = JobManager()
