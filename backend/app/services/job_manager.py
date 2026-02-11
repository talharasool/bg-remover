import uuid
from datetime import datetime, timedelta

from ..db.database import get_connection
from ..models.schemas import ImageResult, JobResponse, JobStatus


class Job:
    """Represents a background removal job (loaded from DB)."""

    def __init__(self, job_id: str, status: str, created_at: datetime, images: dict[str, ImageResult]) -> None:
        self.job_id = job_id
        self.created_at = created_at
        self.status = JobStatus(status)
        self.images = images

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

    def to_response(self) -> JobResponse:
        return JobResponse(
            job_id=self.job_id,
            status=self.status,
            created_at=self.created_at,
            images=list(self.images.values()),
            completed_count=self.completed_count,
            total_count=self.total_count,
        )


def _compute_job_status(images: dict[str, ImageResult]) -> str:
    """Compute overall job status from image statuses."""
    if not images:
        return JobStatus.PENDING

    statuses = [img.status for img in images.values()]
    completed_or_failed = sum(1 for s in statuses if s in (JobStatus.COMPLETED, JobStatus.FAILED))

    if all(s == JobStatus.COMPLETED for s in statuses):
        return JobStatus.COMPLETED
    if any(s == JobStatus.PROCESSING for s in statuses):
        return JobStatus.PROCESSING
    if all(s == JobStatus.FAILED for s in statuses):
        return JobStatus.FAILED
    if completed_or_failed == len(statuses):
        return JobStatus.COMPLETED
    return JobStatus.PENDING


def _load_job_from_rows(job_row: dict, image_rows: list[dict]) -> Job:
    """Build a Job object from DB rows."""
    images: dict[str, ImageResult] = {}
    for row in image_rows:
        images[row["image_id"]] = ImageResult(
            image_id=row["image_id"],
            original_filename=row["original_filename"],
            status=JobStatus(row["status"]),
            download_url=row["download_url"],
            error=row["error"],
        )
    return Job(
        job_id=job_row["job_id"],
        status=job_row["status"],
        created_at=datetime.fromisoformat(job_row["created_at"]),
        images=images,
    )


class JobManager:
    """SQLite-backed job tracking manager."""

    def create_job(self, images: list[dict]) -> Job:
        """Create a new job with the given images."""
        job_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        with get_connection() as conn:
            conn.execute(
                "INSERT INTO jobs (job_id, status, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (job_id, JobStatus.PENDING, now, now),
            )
            image_results: dict[str, ImageResult] = {}
            for img in images:
                image_id = str(uuid.uuid4())
                conn.execute(
                    "INSERT INTO job_images (image_id, job_id, original_filename, status) VALUES (?, ?, ?, ?)",
                    (image_id, job_id, img["filename"], JobStatus.PENDING),
                )
                image_results[image_id] = ImageResult(
                    image_id=image_id,
                    original_filename=img["filename"],
                    status=JobStatus.PENDING,
                )
            conn.commit()

        return Job(
            job_id=job_id,
            status=JobStatus.PENDING,
            created_at=datetime.fromisoformat(now),
            images=image_results,
        )

    def get_job(self, job_id: str) -> Job | None:
        """Get a job by ID."""
        with get_connection() as conn:
            job_row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
            if not job_row:
                return None
            image_rows = conn.execute("SELECT * FROM job_images WHERE job_id = ?", (job_id,)).fetchall()
        return _load_job_from_rows(dict(job_row), [dict(r) for r in image_rows])

    def update_image_status(
        self, job_id: str, image_id: str, status: JobStatus, download_url: str | None = None, error: str | None = None
    ) -> None:
        """Update the status of a specific image in a job."""
        now = datetime.utcnow().isoformat()
        with get_connection() as conn:
            conn.execute(
                "UPDATE job_images SET status = ?, download_url = COALESCE(?, download_url), error = COALESCE(?, error) WHERE image_id = ? AND job_id = ?",
                (status, download_url, error, image_id, job_id),
            )
            # Recompute job status from all images
            image_rows = conn.execute("SELECT * FROM job_images WHERE job_id = ?", (job_id,)).fetchall()
            images: dict[str, ImageResult] = {}
            for row in image_rows:
                images[row["image_id"]] = ImageResult(
                    image_id=row["image_id"],
                    original_filename=row["original_filename"],
                    status=JobStatus(row["status"]),
                    download_url=row["download_url"],
                    error=row["error"],
                )
            new_status = _compute_job_status(images)
            conn.execute("UPDATE jobs SET status = ?, updated_at = ? WHERE job_id = ?", (new_status, now, job_id))
            conn.commit()

    def delete_job(self, job_id: str) -> bool:
        """Delete a job by ID."""
        with get_connection() as conn:
            cursor = conn.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_all_jobs(self) -> list[Job]:
        """Get all jobs."""
        with get_connection() as conn:
            job_rows = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC").fetchall()
            jobs: list[Job] = []
            for job_row in job_rows:
                image_rows = conn.execute("SELECT * FROM job_images WHERE job_id = ?", (job_row["job_id"],)).fetchall()
                jobs.append(_load_job_from_rows(dict(job_row), [dict(r) for r in image_rows]))
            return jobs

    def cleanup_old_jobs(self, max_age_hours: int = 24) -> int:
        """Remove jobs older than max_age_hours."""
        cutoff = (datetime.utcnow() - timedelta(hours=max_age_hours)).isoformat()
        with get_connection() as conn:
            cursor = conn.execute("DELETE FROM jobs WHERE created_at < ?", (cutoff,))
            conn.commit()
            return cursor.rowcount


# Singleton instance
job_manager = JobManager()
