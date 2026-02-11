"""
Locust load testing for ClearCut API.

Run with:
    cd backend
    locust -f tests/stress/locustfile.py --host http://localhost:8000

Then open http://localhost:8089 to configure and start tests.
"""

import io

from locust import HttpUser, between, tag, task
from PIL import Image


def _make_jpeg(width: int = 200, height: int = 200) -> bytes:
    """Generate a minimal JPEG in memory."""
    img = Image.new("RGB", (width, height), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=50)
    buf.seek(0)
    return buf.read()


# Pre-generate images to avoid overhead during tests
SMALL_JPEG = _make_jpeg(200, 200)
MEDIUM_JPEG = _make_jpeg(800, 800)


class ClearCutUser(HttpUser):
    """Simulates a user interacting with the ClearCut API."""

    wait_time = between(1, 3)

    @tag("health")
    @task(1)
    def health_check(self) -> None:
        self.client.get("/health")

    @tag("single")
    @task(5)
    def single_upload(self) -> None:
        """Upload a single image and poll until done or timeout."""
        resp = self.client.post(
            "/api/v1/remove-bg",
            files={"file": ("test.jpg", SMALL_JPEG, "image/jpeg")},
            name="/api/v1/remove-bg [single]",
        )
        if resp.status_code == 200:
            job_id = resp.json().get("job_id")
            if job_id:
                self._poll_status(job_id, max_polls=10)

    @tag("batch")
    @task(2)
    def batch_upload(self) -> None:
        """Upload a batch of 5 images."""
        files = [("files", (f"img{i}.jpg", SMALL_JPEG, "image/jpeg")) for i in range(5)]
        resp = self.client.post(
            "/api/v1/remove-bg/batch",
            files=files,
            name="/api/v1/remove-bg/batch [5 images]",
        )
        if resp.status_code == 200:
            job_id = resp.json().get("job_id")
            if job_id:
                self._poll_status(job_id, max_polls=30)

    @tag("status")
    @task(3)
    def status_poll_nonexistent(self) -> None:
        """Poll status for a non-existent job (expect 404)."""
        with self.client.get(
            "/api/v1/status/nonexistent-job-id",
            name="/api/v1/status/{job_id} [404]",
            catch_response=True,
        ) as resp:
            if resp.status_code == 404:
                resp.success()

    def _poll_status(self, job_id: str, max_polls: int = 10) -> None:
        """Poll job status until completed or max polls reached."""
        import time

        for _ in range(max_polls):
            resp = self.client.get(
                f"/api/v1/status/{job_id}",
                name="/api/v1/status/{job_id} [poll]",
            )
            if resp.status_code == 200:
                status = resp.json().get("status")
                if status in ("completed", "failed"):
                    return
            time.sleep(1)
