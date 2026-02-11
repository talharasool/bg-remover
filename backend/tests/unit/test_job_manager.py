from datetime import datetime

from app.db.database import get_connection
from app.models.schemas import ImageResult, JobStatus
from app.services.job_manager import Job, JobManager

# ---------------------------------------------------------------------------
# Helper to build a Job object directly (for unit-testing the class itself)
# ---------------------------------------------------------------------------


def _make_job(job_id: str = "job-1", filenames: list[str] | None = None) -> Job:
    """Create a Job in-memory for unit tests (bypasses DB)."""
    if filenames is None:
        filenames = ["a.jpg"]
    images: dict[str, ImageResult] = {}
    for i, fn in enumerate(filenames):
        iid = f"img-{i}"
        images[iid] = ImageResult(image_id=iid, original_filename=fn, status=JobStatus.PENDING)
    return Job(job_id=job_id, status=JobStatus.PENDING, created_at=datetime.utcnow(), images=images)


# ---------------------------------------------------------------------------
# Job class
# ---------------------------------------------------------------------------


class TestJob:
    def test_creation(self):
        job = _make_job("job-1", ["a.jpg", "b.jpg"])
        assert job.job_id == "job-1"
        assert job.status == JobStatus.PENDING
        assert job.total_count == 2
        assert job.completed_count == 0
        assert job.progress == 0.0

    def test_progress_updates(self):
        job = _make_job("job-1", ["a.jpg", "b.jpg"])
        ids = list(job.images.keys())
        job.images[ids[0]].status = JobStatus.COMPLETED
        assert job.progress == 0.5

    def test_all_completed(self):
        job = _make_job("job-1", ["a.jpg", "b.jpg"])
        for img in job.images.values():
            img.status = JobStatus.COMPLETED
        assert job.progress == 1.0

    def test_all_failed(self):
        job = _make_job("job-1", ["a.jpg"])
        for img in job.images.values():
            img.status = JobStatus.FAILED
        assert job.completed_count == 1  # failed counts as completed

    def test_mixed_completed_and_failed(self):
        job = _make_job("job-1", ["a.jpg", "b.jpg"])
        ids = list(job.images.keys())
        job.images[ids[0]].status = JobStatus.COMPLETED
        job.images[ids[1]].status = JobStatus.FAILED
        assert job.progress == 1.0

    def test_processing_status(self):
        job = _make_job("job-1", ["a.jpg", "b.jpg"])
        ids = list(job.images.keys())
        job.images[ids[0]].status = JobStatus.PROCESSING
        assert job.progress == 0.0  # processing doesn't count as completed

    def test_to_response(self):
        job = _make_job("job-1", ["a.jpg"])
        resp = job.to_response()
        assert resp.job_id == "job-1"
        assert resp.status == JobStatus.PENDING
        assert resp.total_count == 1
        assert len(resp.images) == 1
        assert resp.images[0].original_filename == "a.jpg"

    def test_empty_job_progress(self):
        job = _make_job("job-1", [])
        assert job.progress == 0.0
        assert job.total_count == 0


# ---------------------------------------------------------------------------
# JobManager class (SQLite-backed)
# ---------------------------------------------------------------------------


class TestJobManager:
    def test_create_job(self, job_manager: JobManager):
        job = job_manager.create_job([{"filename": "a.jpg"}])
        assert job.job_id is not None
        assert job.total_count == 1

    def test_get_job(self, job_manager: JobManager):
        job = job_manager.create_job([{"filename": "a.jpg"}])
        retrieved = job_manager.get_job(job.job_id)
        assert retrieved is not None
        assert retrieved.job_id == job.job_id

    def test_get_nonexistent_job(self, job_manager: JobManager):
        assert job_manager.get_job("nonexistent") is None

    def test_update_image_status(self, job_manager: JobManager):
        job = job_manager.create_job([{"filename": "a.jpg"}])
        image_id = list(job.images.keys())[0]

        job_manager.update_image_status(job.job_id, image_id, JobStatus.COMPLETED, download_url="/download/test")

        updated = job_manager.get_job(job.job_id)
        assert updated is not None
        assert updated.images[image_id].status == JobStatus.COMPLETED
        assert updated.images[image_id].download_url == "/download/test"
        assert updated.status == JobStatus.COMPLETED

    def test_update_image_status_with_error(self, job_manager: JobManager):
        job = job_manager.create_job([{"filename": "a.jpg"}])
        image_id = list(job.images.keys())[0]

        job_manager.update_image_status(job.job_id, image_id, JobStatus.FAILED, error="Processing failed")

        updated = job_manager.get_job(job.job_id)
        assert updated is not None
        assert updated.images[image_id].error == "Processing failed"

    def test_update_nonexistent_job(self, job_manager: JobManager):
        # Should not raise
        job_manager.update_image_status("fake", "fake", JobStatus.COMPLETED)

    def test_delete_job(self, job_manager: JobManager):
        job = job_manager.create_job([{"filename": "a.jpg"}])
        assert job_manager.delete_job(job.job_id) is True
        assert job_manager.get_job(job.job_id) is None

    def test_delete_nonexistent_job(self, job_manager: JobManager):
        assert job_manager.delete_job("nonexistent") is False

    def test_get_all_jobs(self, job_manager: JobManager):
        job_manager.create_job([{"filename": "a.jpg"}])
        job_manager.create_job([{"filename": "b.jpg"}])
        assert len(job_manager.get_all_jobs()) == 2

    def test_cleanup_old_jobs(self, job_manager: JobManager):
        job = job_manager.create_job([{"filename": "a.jpg"}])
        # Backdate in the DB directly
        old_time = "2000-01-01T00:00:00"
        with get_connection() as conn:
            conn.execute("UPDATE jobs SET created_at = ? WHERE job_id = ?", (old_time, job.job_id))
            conn.commit()

        deleted = job_manager.cleanup_old_jobs(max_age_hours=24)
        assert deleted == 1
        assert job_manager.get_job(job.job_id) is None

    def test_cleanup_keeps_recent_jobs(self, job_manager: JobManager):
        job_manager.create_job([{"filename": "a.jpg"}])
        deleted = job_manager.cleanup_old_jobs(max_age_hours=24)
        assert deleted == 0
        assert len(job_manager.get_all_jobs()) == 1

    def test_multiple_jobs_cleanup(self, job_manager: JobManager):
        old = job_manager.create_job([{"filename": "old.jpg"}])
        old_time = "2000-01-01T00:00:00"
        with get_connection() as conn:
            conn.execute("UPDATE jobs SET created_at = ? WHERE job_id = ?", (old_time, old.job_id))
            conn.commit()

        job_manager.create_job([{"filename": "new.jpg"}])

        deleted = job_manager.cleanup_old_jobs(max_age_hours=24)
        assert deleted == 1
        assert len(job_manager.get_all_jobs()) == 1

    def test_persistence(self, job_manager: JobManager):
        """Verify data persists across different JobManager instances."""
        job = job_manager.create_job([{"filename": "persist.jpg"}])
        image_id = list(job.images.keys())[0]
        job_manager.update_image_status(job.job_id, image_id, JobStatus.COMPLETED, download_url="/dl")

        # New instance, same DB
        jm2 = JobManager()
        retrieved = jm2.get_job(job.job_id)
        assert retrieved is not None
        assert retrieved.images[image_id].status == JobStatus.COMPLETED
        assert retrieved.images[image_id].download_url == "/dl"
