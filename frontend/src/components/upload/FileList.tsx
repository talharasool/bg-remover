'use client';

import { useImageStore, UploadedImage } from '@/store/imageStore';
import Spinner from '@/components/ui/Spinner';

function StatusBadge({ status }: { status: UploadedImage['status'] }) {
  const styles = {
    uploading: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  const labels = {
    uploading: 'Uploading',
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {(status === 'uploading' || status === 'processing') && (
        <Spinner size="sm" className="!h-3 !w-3" />
      )}
      {labels[status]}
    </span>
  );
}

function FileItem({ image }: { image: UploadedImage }) {
  const { removeImage } = useImageStore();

  const handleRemove = () => {
    if (image.status !== 'uploading' && image.status !== 'processing') {
      removeImage(image.id);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
        <img
          src={image.preview}
          alt={image.file.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {image.file.name}
        </p>
        <p className="text-xs text-gray-500">
          {(image.file.size / 1024).toFixed(1)} KB
        </p>
      </div>

      <StatusBadge status={image.status} />

      {image.status !== 'uploading' && image.status !== 'processing' && (
        <button
          onClick={handleRemove}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Remove"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function FileList() {
  const { images, clearAll } = useImageStore();

  if (images.length === 0) {
    return null;
  }

  const hasCompletedImages = images.some((img) => img.status === 'completed');
  const isProcessing = images.some(
    (img) => img.status === 'uploading' || img.status === 'processing' || img.status === 'pending'
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">
          Uploaded Images ({images.length})
        </h3>
        {!isProcessing && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {images.map((image) => (
          <FileItem key={image.id} image={image} />
        ))}
      </div>
    </div>
  );
}
