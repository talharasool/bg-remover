import io
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException, UploadFile
from PIL import Image

from app.utils.validators import validate_batch, validate_image
from tests.conftest import create_test_image

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_upload_file(
    content: bytes,
    filename: str = "test.jpg",
    content_type: str = "image/jpeg",
) -> UploadFile:
    """Create an UploadFile from raw bytes."""
    return UploadFile(
        file=io.BytesIO(content),
        filename=filename,
        headers=MagicMock(get=lambda key, default=None: content_type if key == "content-type" else default),
    )


# ---------------------------------------------------------------------------
# validate_image — happy paths
# ---------------------------------------------------------------------------


class TestValidateImageSuccess:
    async def test_valid_jpeg(self, small_jpeg: bytes):
        upload = make_upload_file(small_jpeg, "photo.jpg", "image/jpeg")
        result = await validate_image(upload)
        assert isinstance(result, bytes)
        assert len(result) > 0

    async def test_valid_png(self, small_png: bytes):
        upload = make_upload_file(small_png, "photo.png", "image/png")
        result = await validate_image(upload)
        assert isinstance(result, bytes)

    async def test_valid_webp(self):
        img = Image.new("RGB", (50, 50), color=(0, 255, 0))
        buf = io.BytesIO()
        img.save(buf, format="WEBP")
        content = buf.getvalue()

        upload = make_upload_file(content, "photo.webp", "image/webp")
        result = await validate_image(upload)
        assert len(result) > 0


# ---------------------------------------------------------------------------
# validate_image — content type rejection
# ---------------------------------------------------------------------------


class TestValidateImageContentType:
    async def test_reject_gif(self, small_jpeg: bytes):
        upload = make_upload_file(small_jpeg, "anim.gif", "image/gif")
        with pytest.raises(HTTPException) as exc:
            await validate_image(upload)
        assert exc.value.status_code == 400
        assert "Invalid file type" in exc.value.detail

    async def test_reject_pdf(self, small_jpeg: bytes):
        upload = make_upload_file(small_jpeg, "doc.pdf", "application/pdf")
        with pytest.raises(HTTPException) as exc:
            await validate_image(upload)
        assert exc.value.status_code == 400


# ---------------------------------------------------------------------------
# validate_image — extension rejection
# ---------------------------------------------------------------------------


class TestValidateImageExtension:
    async def test_reject_bad_extension(self, small_jpeg: bytes):
        upload = make_upload_file(small_jpeg, "photo.bmp", "image/jpeg")
        with pytest.raises(HTTPException) as exc:
            await validate_image(upload)
        assert exc.value.status_code == 400
        assert "Invalid file extension" in exc.value.detail


# ---------------------------------------------------------------------------
# validate_image — file size
# ---------------------------------------------------------------------------


class TestValidateImageSize:
    async def test_reject_oversized(self, oversized_bytes: bytes):
        upload = make_upload_file(oversized_bytes, "big.jpg", "image/jpeg")
        with pytest.raises(HTTPException) as exc:
            await validate_image(upload)
        assert exc.value.status_code == 400
        assert "File too large" in exc.value.detail


# ---------------------------------------------------------------------------
# validate_image — dimension limits
# ---------------------------------------------------------------------------


class TestValidateImageDimensions:
    async def test_reject_huge_dimensions(self):
        # 6000x6000 = 36 megapixels > 25 megapixels limit
        content = create_test_image(6000, 6000, "JPEG")
        upload = make_upload_file(content, "huge.jpg", "image/jpeg")
        with pytest.raises(HTTPException) as exc:
            await validate_image(upload)
        assert exc.value.status_code == 400
        assert "Image too large" in exc.value.detail

    async def test_accept_within_limits(self):
        # 4000x4000 = 16 megapixels < 25 megapixels
        content = create_test_image(4000, 4000, "JPEG")
        upload = make_upload_file(content, "large.jpg", "image/jpeg")
        result = await validate_image(upload)
        assert len(result) > 0


# ---------------------------------------------------------------------------
# validate_image — corrupt data
# ---------------------------------------------------------------------------


class TestValidateImageCorrupt:
    async def test_reject_corrupt_data(self):
        upload = make_upload_file(b"not an image", "bad.jpg", "image/jpeg")
        with pytest.raises(HTTPException) as exc:
            await validate_image(upload)
        assert exc.value.status_code == 400
        assert "Invalid image file" in exc.value.detail


# ---------------------------------------------------------------------------
# validate_batch
# ---------------------------------------------------------------------------


class TestValidateBatch:
    async def test_empty_batch_rejected(self):
        with pytest.raises(HTTPException) as exc:
            await validate_batch([])
        assert exc.value.status_code == 400
        assert "No files" in exc.value.detail

    async def test_too_many_files(self, small_jpeg: bytes):
        files = [make_upload_file(small_jpeg, f"img{i}.jpg", "image/jpeg") for i in range(21)]
        with pytest.raises(HTTPException) as exc:
            await validate_batch(files)
        assert exc.value.status_code == 400
        assert "Too many files" in exc.value.detail

    async def test_valid_batch(self, small_jpeg: bytes):
        files = [make_upload_file(small_jpeg, f"img{i}.jpg", "image/jpeg") for i in range(3)]
        result = await validate_batch(files)
        assert len(result) == 3
        for _upload_file, content in result:
            assert isinstance(content, bytes)
            assert len(content) > 0

    async def test_batch_fails_on_bad_file(self, small_jpeg: bytes):
        files = [
            make_upload_file(small_jpeg, "good.jpg", "image/jpeg"),
            make_upload_file(small_jpeg, "bad.gif", "image/gif"),
        ]
        with pytest.raises(HTTPException):
            await validate_batch(files)
