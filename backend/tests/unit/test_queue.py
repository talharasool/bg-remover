"""Tests for Huey task queue setup and task registration."""

from unittest.mock import MagicMock, patch

import pytest

from tests.conftest import create_test_image


class TestHueyQueue:
    def test_queue_uses_sqlite(self):
        """Huey queue should be backed by SQLite."""
        from app.tasks.queue import huey

        assert huey.name == "clearcut"
        assert "huey.db" in str(huey.storage_kwargs.get("filename", ""))

    def test_tasks_registered(self):
        """Worker tasks should be registered with the Huey instance."""
        import app.tasks.worker  # noqa: F401
        from app.tasks.queue import huey

        task_names = list(huey._registry._registry.keys())
        assert any("process_image_task" in name for name in task_names)
        assert any("process_batch_task" in name for name in task_names)


class TestProcessImageTask:
    def test_task_calls_rembg(self, _patch_settings):
        """process_image_task should invoke rembg and update job status."""
        from app.services.job_manager import job_manager

        job = job_manager.create_job([{"filename": "test.jpg"}])
        image_id = list(job.images.keys())[0]

        # Write a fake "original" file
        from app.config import settings

        job_dir = settings.original_dir / job.job_id
        job_dir.mkdir(parents=True, exist_ok=True)
        original_path = str(job_dir / "test.jpg")
        with open(original_path, "wb") as f:
            f.write(create_test_image())

        fake_processed = b"\x89PNG-fake-output"
        mock_session = MagicMock()

        with (
            patch("rembg.remove", return_value=fake_processed),
            patch("app.tasks.worker._get_session", return_value=mock_session),
        ):
            from app.tasks.worker import process_image_task

            result = process_image_task.call_local(job.job_id, image_id, original_path, "test.jpg")

        assert result is not None

        updated = job_manager.get_job(job.job_id)
        assert updated is not None
        from app.models.schemas import JobStatus

        assert updated.images[image_id].status == JobStatus.COMPLETED

    def test_task_handles_failure(self, _patch_settings):
        """process_image_task should mark image as FAILED on error."""
        from app.services.job_manager import job_manager

        job = job_manager.create_job([{"filename": "bad.jpg"}])
        image_id = list(job.images.keys())[0]

        # No file at this path → get_file returns None → ValueError
        from app.tasks.worker import process_image_task

        with pytest.raises(ValueError, match="Original image not found"):
            process_image_task.call_local(job.job_id, image_id, "/nonexistent/path", "bad.jpg")

        updated = job_manager.get_job(job.job_id)
        assert updated is not None
        from app.models.schemas import JobStatus

        assert updated.images[image_id].status == JobStatus.FAILED
