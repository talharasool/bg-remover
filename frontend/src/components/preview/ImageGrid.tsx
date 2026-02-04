'use client';

import { useImageStore } from '@/store/imageStore';
import ImagePreview from './ImagePreview';

export default function ImageGrid() {
  const { images } = useImageStore();

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Preview
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image) => (
          <ImagePreview key={image.id} image={image} />
        ))}
      </div>
    </div>
  );
}
