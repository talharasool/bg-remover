"""Tests for Cloudflare R2 storage backend."""

from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from tests.conftest import create_test_image, create_test_png


@pytest.fixture
def mock_s3_client():
    """Mock boto3 S3 client."""
    return MagicMock()


@pytest.fixture
def r2_storage(mock_s3_client):
    """R2Storage instance with mocked S3 client."""
    with patch("app.services.storage.r2.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_s3_client

        from app.services.storage.r2 import R2Storage

        storage = R2Storage()
        return storage


class TestR2SaveOriginal:
    async def test_save_original(self, r2_storage, mock_s3_client):
        content = create_test_image()
        key = await r2_storage.save_original(content, "photo.jpg", "job-1")

        assert key == "original/job-1/photo.jpg"
        mock_s3_client.put_object.assert_called_once_with(
            Bucket=r2_storage.bucket_name, Key="original/job-1/photo.jpg", Body=content
        )

    async def test_save_original_preserves_filename(self, r2_storage, mock_s3_client):
        content = create_test_image()
        key = await r2_storage.save_original(content, "my image.png", "job-2")
        assert key == "original/job-2/my image.png"


class TestR2SaveProcessed:
    async def test_save_processed_converts_to_png(self, r2_storage, mock_s3_client):
        content = create_test_png()
        key = await r2_storage.save_processed(content, "photo.jpg", "job-1")

        assert key == "processed/job-1/photo.png"
        mock_s3_client.put_object.assert_called_once_with(
            Bucket=r2_storage.bucket_name,
            Key="processed/job-1/photo.png",
            Body=content,
            ContentType="image/png",
        )


class TestR2GetFile:
    async def test_get_file_success(self, r2_storage, mock_s3_client):
        expected = b"file-content"
        mock_body = MagicMock()
        mock_body.read.return_value = expected
        mock_s3_client.get_object.return_value = {"Body": mock_body}

        result = await r2_storage.get_file("original/job-1/photo.jpg")
        assert result == expected

    async def test_get_file_not_found(self, r2_storage, mock_s3_client):
        mock_s3_client.get_object.side_effect = ClientError(
            {"Error": {"Code": "NoSuchKey", "Message": "Not found"}}, "GetObject"
        )
        result = await r2_storage.get_file("missing/key")
        assert result is None


class TestR2DeleteFile:
    async def test_delete_file_success(self, r2_storage, mock_s3_client):
        result = await r2_storage.delete_file("original/job-1/photo.jpg")
        assert result is True
        mock_s3_client.delete_object.assert_called_once()

    async def test_delete_file_error(self, r2_storage, mock_s3_client):
        mock_s3_client.delete_object.side_effect = ClientError(
            {"Error": {"Code": "InternalError", "Message": "Fail"}}, "DeleteObject"
        )
        result = await r2_storage.delete_file("bad/key")
        assert result is False


class TestR2ListFiles:
    async def test_list_files(self, r2_storage, mock_s3_client):
        mock_s3_client.list_objects_v2.return_value = {
            "Contents": [{"Key": "original/job-1/a.jpg"}, {"Key": "original/job-1/b.jpg"}]
        }
        files = await r2_storage.list_files("original/job-1/")
        assert len(files) == 2
        assert "original/job-1/a.jpg" in files

    async def test_list_files_empty(self, r2_storage, mock_s3_client):
        mock_s3_client.list_objects_v2.return_value = {}
        files = await r2_storage.list_files("empty/")
        assert files == []

    async def test_list_files_error(self, r2_storage, mock_s3_client):
        mock_s3_client.list_objects_v2.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied", "Message": "Denied"}}, "ListObjectsV2"
        )
        files = await r2_storage.list_files()
        assert files == []


class TestR2GetFilePath:
    async def test_get_file_path_always_none(self, r2_storage):
        """R2 has no local file path — always returns None."""
        result = await r2_storage.get_file_path("any/key")
        assert result is None


class TestStorageFactory:
    def test_default_is_local(self):
        from app.services.storage import get_storage
        from app.services.storage.local import LocalStorage

        storage = get_storage()
        assert isinstance(storage, LocalStorage)

    def test_r2_backend(self):
        from app.config import settings
        from app.services.storage import get_storage

        original = settings.storage_backend
        settings.storage_backend = "r2"
        try:
            with patch("app.services.storage.r2.boto3"):
                storage = get_storage()
                from app.services.storage.r2 import R2Storage

                assert isinstance(storage, R2Storage)
        finally:
            settings.storage_backend = original
