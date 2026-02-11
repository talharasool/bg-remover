"""Cloudflare R2 storage backend (S3-compatible)."""

from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from ...config import settings
from .base import StorageBackend


class R2Storage(StorageBackend):
    """Cloudflare R2 storage using S3-compatible API."""

    def __init__(self) -> None:
        self.bucket_name = settings.r2_bucket_name
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
        )

    def _key(self, prefix: str, job_id: str, filename: str) -> str:
        return f"{prefix}/{job_id}/{filename}"

    async def save_original(self, file_content: bytes, filename: str, job_id: str) -> str:
        """Upload original file to R2."""
        key = self._key("original", job_id, filename)
        self.client.put_object(Bucket=self.bucket_name, Key=key, Body=file_content)
        return key

    async def save_processed(self, file_content: bytes, filename: str, job_id: str) -> str:
        """Upload processed file to R2 (always PNG)."""
        base_name = Path(filename).stem
        output_filename = f"{base_name}.png"
        key = self._key("processed", job_id, output_filename)
        self.client.put_object(Bucket=self.bucket_name, Key=key, Body=file_content, ContentType="image/png")
        return key

    async def get_file(self, path: str) -> bytes | None:
        """Download file from R2 by key."""
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=path)
            content: bytes = response["Body"].read()
            return content
        except ClientError:
            return None

    async def delete_file(self, path: str) -> bool:
        """Delete file from R2."""
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=path)
            return True
        except ClientError:
            return False

    async def list_files(self, prefix: str = "") -> list[str]:
        """List files in R2 with optional prefix."""
        try:
            response = self.client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
            return [obj["Key"] for obj in response.get("Contents", [])]
        except ClientError:
            return []

    async def get_file_path(self, path: str) -> Path | None:
        """R2 storage has no local file path — always returns None."""
        return None
