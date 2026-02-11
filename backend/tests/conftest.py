import io
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image

# ---------------------------------------------------------------------------
# Test image generators
# ---------------------------------------------------------------------------


def create_test_image(width: int = 100, height: int = 100, fmt: str = "JPEG") -> bytes:
    """Create a minimal test image in memory."""
    img = Image.new("RGB", (width, height), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf.read()


def create_test_png(width: int = 100, height: int = 100) -> bytes:
    """Create a minimal test PNG with alpha channel."""
    img = Image.new("RGBA", (width, height), color=(255, 0, 0, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


# ---------------------------------------------------------------------------
# Fixtures: images
# ---------------------------------------------------------------------------


@pytest.fixture
def small_jpeg() -> bytes:
    return create_test_image(100, 100, "JPEG")


@pytest.fixture
def small_png() -> bytes:
    return create_test_png(100, 100)


@pytest.fixture
def large_jpeg() -> bytes:
    """4000x4000 image for stress / dimension tests."""
    return create_test_image(4000, 4000, "JPEG")


@pytest.fixture
def oversized_bytes() -> bytes:
    """Bytes larger than max file size (21 MB of zeros wrapped in JPEG header)."""
    img = Image.new("RGB", (100, 100), color=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    data = buf.read()
    return data + b"\x00" * (21 * 1024 * 1024)


# ---------------------------------------------------------------------------
# Fixtures: temp directories & settings override
# ---------------------------------------------------------------------------


@pytest.fixture
def tmp_upload_dir(tmp_path: Path):
    """Provide a temporary upload directory tree."""
    original = tmp_path / "uploads" / "original"
    processed = tmp_path / "uploads" / "processed"
    original.mkdir(parents=True)
    processed.mkdir(parents=True)
    return tmp_path / "uploads"


@pytest.fixture
def _patch_settings(tmp_upload_dir: Path):
    """Patch global settings and database to use temp directories."""
    from app.config import settings
    from app.db.database import init_db, reset_db_path, set_db_path

    orig_upload = settings.upload_dir
    orig_original = settings.original_dir
    orig_processed = settings.processed_dir

    settings.upload_dir = tmp_upload_dir
    settings.original_dir = tmp_upload_dir / "original"
    settings.processed_dir = tmp_upload_dir / "processed"

    # Point DB to temp directory
    set_db_path(tmp_upload_dir / "test.db")
    init_db()

    yield

    settings.upload_dir = orig_upload
    settings.original_dir = orig_original
    settings.processed_dir = orig_processed
    reset_db_path()


# ---------------------------------------------------------------------------
# Fixtures: services
# ---------------------------------------------------------------------------


@pytest.fixture
def job_manager(_patch_settings):
    """Fresh JobManager instance backed by temp SQLite DB."""
    from app.services.job_manager import JobManager

    return JobManager()


@pytest.fixture
def local_storage(_patch_settings):
    """LocalStorage backed by temp directory."""
    from app.services.storage.local import LocalStorage

    return LocalStorage()


# ---------------------------------------------------------------------------
# Fixtures: async test client
# ---------------------------------------------------------------------------


@pytest.fixture
async def client(_patch_settings):
    """Async test client with mocked Huey tasks (tasks are no-ops in tests)."""
    mock_image_task = MagicMock()
    mock_batch_task = MagicMock()

    with (
        patch("app.api.v1.endpoints.images.process_image_task", mock_image_task),
        patch("app.api.v1.endpoints.images.process_batch_task", mock_batch_task),
        patch("app.services.image_processor.ImageProcessor.__init__", lambda self: None),
    ):
        from app.main import app

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            ac._mock_image_task = mock_image_task  # type: ignore[attr-defined]
            ac._mock_batch_task = mock_batch_task  # type: ignore[attr-defined]
            yield ac
