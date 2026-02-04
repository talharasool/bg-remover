'use client';

import { useImageStore } from '@/store/imageStore';
import ImagePreview from './ImagePreview';

export default function ImageGrid() {
  const { images } = useImageStore();

  if (images.length === 0) {
    return null;
  }

  // If single image, show as hero
  if (images.length === 1) {
    return (
      <div className="animate-scale-in">
        <div className="max-w-2xl mx-auto">
          <ImagePreview image={images[0]} isHero />
        </div>
      </div>
    );
  }

  // Multiple images - grid layout with equal sizing
  return (
    <div className="animate-fade-in">
      <div className={`
        grid gap-6
        ${images.length === 2 ? 'grid-cols-2 max-w-4xl mx-auto' : ''}
        ${images.length === 3 ? 'grid-cols-2 lg:grid-cols-3' : ''}
        ${images.length >= 4 ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}
      `}>
        {images.map((image, index) => (
          <div
            key={image.id}
            className="animate-scale-in w-full"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ImagePreview image={image} />
          </div>
        ))}
      </div>
    </div>
  );
}
