"""Tests for rate limiting middleware."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from tests.conftest import create_test_image


@pytest.fixture
async def rate_client(_patch_settings):
    """Async test client for rate limit testing."""
    with (
        patch("app.api.v1.endpoints.images.process_image_task", MagicMock()),
        patch("app.api.v1.endpoints.images.process_batch_task", MagicMock()),
        patch("app.services.image_processor.ImageProcessor.__init__", lambda self: None),
    ):
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


class TestRateLimitMiddleware:
    async def test_rate_limit_handler_returns_429(self, rate_client):
        """Verify the custom 429 handler returns the expected JSON body."""
        jpeg = create_test_image()
        responses = []

        # Hit the single-upload endpoint many times to trigger the limit.
        # The limit is 10/minute on /remove-bg.
        for _ in range(15):
            resp = await rate_client.post(
                "/api/v1/remove-bg",
                files={"file": ("test.jpg", jpeg, "image/jpeg")},
            )
            responses.append(resp)

        # At least one response should be 429
        status_codes = [r.status_code for r in responses]
        assert 429 in status_codes, f"Expected 429 in {status_codes}"

        # Verify 429 response body shape
        last_429 = next(r for r in responses if r.status_code == 429)
        body = last_429.json()
        assert "detail" in body
        assert "rate limit" in body["detail"].lower()

    async def test_batch_rate_limit(self, rate_client):
        """Batch endpoint has a tighter limit (5/minute)."""
        jpeg = create_test_image()
        responses = []

        for _ in range(8):
            resp = await rate_client.post(
                "/api/v1/remove-bg/batch",
                files=[("files", ("a.jpg", jpeg, "image/jpeg"))],
            )
            responses.append(resp)

        status_codes = [r.status_code for r in responses]
        assert 429 in status_codes, f"Expected 429 in {status_codes}"

    async def test_non_limited_endpoints_unaffected(self, rate_client):
        """Health and status endpoints are not rate-limited."""
        for _ in range(20):
            resp = await rate_client.get("/health")
            assert resp.status_code == 200
