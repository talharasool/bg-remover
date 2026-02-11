# ---------------------------------------------------------------------------
# Health & root endpoints
# ---------------------------------------------------------------------------


class TestHealthEndpoints:
    async def test_root(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "name" in data
        assert "version" in data

    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    async def test_stats(self, client):
        resp = await client.get("/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_size_mb" in data


# ---------------------------------------------------------------------------
# Single upload
# ---------------------------------------------------------------------------


class TestSingleUpload:
    async def test_upload_valid_jpeg(self, client, small_jpeg: bytes):
        resp = await client.post(
            "/api/v1/remove-bg",
            files={"file": ("test.jpg", small_jpeg, "image/jpeg")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "job_id" in data
        assert data["total_images"] == 1

    async def test_upload_valid_png(self, client, small_png: bytes):
        resp = await client.post(
            "/api/v1/remove-bg",
            files={"file": ("test.png", small_png, "image/png")},
        )
        assert resp.status_code == 200

    async def test_upload_invalid_type(self, client, small_jpeg: bytes):
        resp = await client.post(
            "/api/v1/remove-bg",
            files={"file": ("test.gif", small_jpeg, "image/gif")},
        )
        assert resp.status_code == 400

    async def test_upload_no_file(self, client):
        resp = await client.post("/api/v1/remove-bg")
        assert resp.status_code == 422  # FastAPI validation error


# ---------------------------------------------------------------------------
# Batch upload
# ---------------------------------------------------------------------------


class TestBatchUpload:
    async def test_batch_upload(self, client, small_jpeg: bytes):
        files = [("files", (f"img{i}.jpg", small_jpeg, "image/jpeg")) for i in range(3)]
        resp = await client.post("/api/v1/remove-bg/batch", files=files)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_images"] == 3

    async def test_batch_too_many(self, client, small_jpeg: bytes):
        files = [("files", (f"img{i}.jpg", small_jpeg, "image/jpeg")) for i in range(21)]
        resp = await client.post("/api/v1/remove-bg/batch", files=files)
        assert resp.status_code == 400

    async def test_batch_empty(self, client):
        resp = await client.post("/api/v1/remove-bg/batch", files=[])
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Job status polling
# ---------------------------------------------------------------------------


class TestJobStatus:
    async def test_status_after_upload(self, client, small_jpeg: bytes):
        # Upload first
        upload_resp = await client.post(
            "/api/v1/remove-bg",
            files={"file": ("test.jpg", small_jpeg, "image/jpeg")},
        )
        job_id = upload_resp.json()["job_id"]

        # Poll status
        status_resp = await client.get(f"/api/v1/status/{job_id}")
        assert status_resp.status_code == 200
        data = status_resp.json()
        assert data["job_id"] == job_id
        assert data["total_count"] == 1
        assert "images" in data

    async def test_status_nonexistent_job(self, client):
        resp = await client.get("/api/v1/status/nonexistent-id")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------


class TestDownload:
    async def test_download_not_ready(self, client, small_jpeg: bytes):
        # Upload
        upload_resp = await client.post(
            "/api/v1/remove-bg",
            files={"file": ("test.jpg", small_jpeg, "image/jpeg")},
        )
        job_id = upload_resp.json()["job_id"]

        # Get image_id from status
        status_resp = await client.get(f"/api/v1/status/{job_id}")
        image_id = status_resp.json()["images"][0]["image_id"]

        # Try download before processing completes
        dl_resp = await client.get(f"/api/v1/download/{job_id}/{image_id}")
        assert dl_resp.status_code == 400

    async def test_download_nonexistent_job(self, client):
        resp = await client.get("/api/v1/download/fake-job/fake-image")
        assert resp.status_code == 404
