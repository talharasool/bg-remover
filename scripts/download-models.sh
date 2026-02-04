#!/bin/bash

# Script to pre-download the U2-Net model for rembg
# Run this before building Docker images to cache the model

echo "Downloading U2-Net model..."

python3 -c "
from rembg import remove
from PIL import Image
import io

# Create a small test image to trigger model download
img = Image.new('RGB', (10, 10), color='red')
img_bytes = io.BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)

# This will download the model if not present
remove(img_bytes.read())
print('Model downloaded successfully!')
"

echo "Done!"
