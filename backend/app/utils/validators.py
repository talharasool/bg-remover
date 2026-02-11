from io import BytesIO

from fastapi import HTTPException, UploadFile
from PIL import Image

from ..config import settings


async def validate_image(file: UploadFile) -> bytes:
    """Validate an uploaded image file."""

    # Check content type
    if file.content_type not in settings.allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed types: {', '.join(settings.allowed_content_types)}",
        )

    # Check file extension
    if file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in settings.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file extension: {ext}. Allowed extensions: {', '.join(settings.allowed_extensions)}",
            )

    # Read file content
    content = await file.read()

    # Check file size
    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {len(content)} bytes. Maximum size: {settings.max_file_size} bytes ({settings.max_file_size // (1024 * 1024)}MB)",
        )

    # Check image dimensions
    try:
        img = Image.open(BytesIO(content))
        width, height = img.size
        pixels = width * height

        if pixels > settings.max_resolution:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large: {width}x{height} ({pixels} pixels). Maximum: {settings.max_resolution} pixels",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}") from None

    return content


async def validate_batch(files: list[UploadFile]) -> list[tuple[UploadFile, bytes]]:
    """Validate a batch of uploaded images."""

    if len(files) > settings.max_batch_size:
        raise HTTPException(
            status_code=400, detail=f"Too many files: {len(files)}. Maximum batch size: {settings.max_batch_size}"
        )

    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files uploaded")

    validated = []
    for file in files:
        content = await validate_image(file)
        validated.append((file, content))

    return validated
