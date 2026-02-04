import asyncio
from io import BytesIO
from PIL import Image
from rembg import remove, new_session
from ..config import settings
from ..models.schemas import JobStatus
from .job_manager import job_manager
from .storage.local import storage


class ImageProcessor:
    """Service for processing images with background removal."""

    def __init__(self):
        self.storage = storage
        self.job_manager = job_manager
        # Use BiRefNet for better quality background removal
        self.session = new_session("birefnet-general")

    async def process_image(self, image_data: bytes) -> bytes:
        """Remove background from an image using rembg with BiRefNet."""
        # Run rembg in a thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._remove_background,
            image_data
        )
        return result

    def _remove_background(self, image_data: bytes) -> bytes:
        """Synchronous background removal using rembg with BiRefNet."""
        # Process with rembg using BiRefNet model (better quality than U2-Net)
        output = remove(image_data, session=self.session)
        return output

    async def process_job_image(
        self,
        job_id: str,
        image_id: str,
        original_path: str,
        original_filename: str
    ):
        """Process a single image from a job."""
        try:
            # Update status to processing
            self.job_manager.update_image_status(
                job_id, image_id, JobStatus.PROCESSING
            )

            # Load original image
            image_data = await self.storage.get_file(original_path)
            if not image_data:
                raise ValueError("Original image not found")

            # Process image
            processed_data = await self.process_image(image_data)

            # Save processed image
            processed_path = await self.storage.save_processed(
                processed_data, original_filename, job_id
            )

            # Generate download URL
            download_url = f"/api/v1/download/{job_id}/{image_id}"

            # Update status to completed
            self.job_manager.update_image_status(
                job_id, image_id, JobStatus.COMPLETED,
                download_url=download_url
            )

            return processed_path

        except Exception as e:
            # Update status to failed
            self.job_manager.update_image_status(
                job_id, image_id, JobStatus.FAILED,
                error=str(e)
            )
            raise

    async def process_batch(
        self,
        job_id: str,
        images: list[dict]
    ):
        """Process all images in a batch job."""
        for img in images:
            await self.process_job_image(
                job_id=job_id,
                image_id=img["image_id"],
                original_path=img["original_path"],
                original_filename=img["filename"]
            )


# Singleton instance
image_processor = ImageProcessor()
