'use client';

import { useState } from 'react';
import { UploadedImage } from '@/store/imageStore';
import { getDownloadUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';

interface ImagePreviewProps {
  image: UploadedImage;
}

export default function ImagePreview({ image }: ImagePreviewProps) {
  const [showProcessed, setShowProcessed] = useState(true);

  const processedUrl =
    image.status === 'completed' && image.jobId && image.imageId
      ? getDownloadUrl(image.jobId, image.imageId)
      : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-square">
        {/* Original Image (always shown as base) */}
        <img
          src={image.preview}
          alt={`Original: ${image.file.name}`}
          className={`absolute inset-0 w-full h-full object-contain ${
            showProcessed && processedUrl ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-200`}
        />

        {/* Processed Image */}
        {processedUrl && (
          <div
            className={`absolute inset-0 checkerboard ${
              showProcessed ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-200`}
          >
            <img
              src={processedUrl}
              alt={`Processed: ${image.file.name}`}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Loading Overlay */}
        {(image.status === 'uploading' ||
          image.status === 'pending' ||
          image.status === 'processing') && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="mt-2 text-sm text-gray-600 capitalize">
              {image.status}...
            </p>
          </div>
        )}

        {/* Error Overlay */}
        {image.status === 'failed' && (
          <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center p-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-2 text-sm text-red-600 text-center">
              {image.error || 'Processing failed'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-900 truncate" title={image.file.name}>
          {image.file.name}
        </p>

        {/* Toggle for completed images */}
        {image.status === 'completed' && processedUrl && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setShowProcessed(false)}
              className={`flex-1 px-2 py-1 text-xs rounded ${
                !showProcessed
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setShowProcessed(true)}
              className={`flex-1 px-2 py-1 text-xs rounded ${
                showProcessed
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Processed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
