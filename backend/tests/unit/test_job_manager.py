from datetime import datetime, timedelta

from app.models.schemas import JobStatus
from app.services.job_manager import Job, JobManager

# ---------------------------------------------------------------------------
# Job class
# ---------------------------------------------------------------------------


class TestJob:
    def test_creation(self):
        job = Job("job-1", [{"filename": "a.jpg"}, {"filename": "b.jpg"}])
        assert job.job_id == "job-1"
        assert job.status == JobStatus.PENDING
        assert job.total_count == 2
        assert job.completed_count == 0
        assert job.progress == 0.0

    def test_progress_updates(self):
        job = Job("job-1", [{"filename": "a.jpg"}, {"filename": "b.jpg"}])
        ids = list(job.images.keys())

        # Complete one image — job stays PENDING because no image is PROCESSING
        job.images[ids[0]].status = JobStatus.COMPLETED
        job.update_status()
        assert job.progress == 0.5
        assert job.status == JobStatus.PENDING

    def test_all_completed(self):
        job = Job("job-1", [{"filename": "a.jpg"}, {"filename": "b.jpg"}])
        for img in job.images.values():
            img.status = JobStatus.COMPLETED
        job.update_status()
        assert job.status == JobStatus.COMPLETED
        assert job.progress == 1.0

    def test_all_failed(self):
        job = Job("job-1", [{"filename": "a.jpg"}])
        for img in job.images.values():
            img.status = JobStatus.FAILED
        job.update_status()
        assert job.status == JobStatus.FAILED

    def test_mixed_completed_and_failed(self):
        job = Job("job-1", [{"filename": "a.jpg"}, {"filename": "b.jpg"}])
        ids = list(job.images.keys())
        job.images[ids[0]].status = JobStatus.COMPLETED
        job.images[ids[1]].status = JobStatus.FAILED
        job.update_status()
        # Both done (completed + failed counts as completed_count)
        assert job.status == JobStatus.COMPLETED
        assert job.progress == 1.0

    def test_processing_status(self):
        job = Job("job-1", [{"filename": "a.jpg"}, {"filename": "b.jpg"}])
        ids = list(job.images.keys())
        job.images[ids[0]].status = JobStatus.PROCESSING
        job.update_status()
        assert job.status == JobStatus.PROCESSING

    def test_to_response(self):
        job = Job("job-1", [{"filename": "a.jpg"}])
        resp = job.to_response()
        assert resp.job_id == "job-1"
        assert resp.status == JobStatus.PENDING
        assert resp.total_count == 1
        assert len(resp.images) == 1
        assert resp.images[0].original_filename == "a.jpg"

    def test_empty_job_progress(self):
        job = Job("job-1", [])
        assert job.progress == 0.0
        assert job.total_count == 0


# ---------------------------------------------------------------------------
# JobManager class
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
        # Manually backdate the job
        job.created_at = datetime.utcnow() - timedelta(hours=25)

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
        old.created_at = datetime.utcnow() - timedelta(hours=48)

        _new = job_manager.create_job([{"filename": "new.jpg"}])

        deleted = job_manager.cleanup_old_jobs(max_age_hours=24)
        assert deleted == 1
        assert len(job_manager.get_all_jobs()) == 1
