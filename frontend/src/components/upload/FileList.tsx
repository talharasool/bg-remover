'use client';

import { useImageStore, UploadedImage } from '@/store/imageStore';
import Spinner from '@/components/ui/Spinner';

function StatusIndicator({ status }: { status: UploadedImage['status'] }) {
  const config = {
    uploading: { color: 'bg-blue-500', pulse: true },
    pending: { color: 'bg-amber-400', pulse: true },
    processing: { color: 'bg-violet-500', pulse: true },
    completed: { color: 'bg-emerald-500', pulse: false },
    failed: { color: 'bg-red-500', pulse: false },
  };

  const { color, pulse } = config[status];

  return (
    <div className="relative flex items-center justify-center w-2 h-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      {pulse && (
        <div className={`absolute w-2 h-2 rounded-full ${color} animate-ping opacity-75`} />
      )}
    </div>
  );
}

function FileItem({ image }: { image: UploadedImage }) {
  const { removeImage } = useImageStore();
  const isProcessing = ['uploading', 'processing', 'pending'].includes(image.status);

  const handleRemove = () => {
    if (!isProcessing) {
      removeImage(image.id);
    }
  };

  const statusLabels = {
    uploading: 'Uploading',
    pending: 'In queue',
    processing: 'Processing',
    completed: 'Done',
    failed: 'Failed',
  };

  return (
    <div className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors duration-200">
      {/* Thumbnail */}
      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
        <img
          src={image.preview}
          alt={image.file.name}
          className="w-full h-full object-cover"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-caption font-medium text-slate-700 truncate">
          {image.file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <StatusIndicator status={image.status} />
          <span className="text-tiny text-slate-400">
            {statusLabels[image.status]}
          </span>
        </div>
      </div>

      {/* Remove button */}
      {!isProcessing && (
        <button
          onClick={handleRemove}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

  const isProcessing = images.some(
    (img) => ['uploading', 'processing', 'pending'].includes(img.status)
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <span className="text-caption font-medium text-slate-500">
          {images.length} {images.length === 1 ? 'image' : 'images'}
        </span>
        {!isProcessing && (
          <button
            onClick={clearAll}
            className="text-tiny text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {images.map((image) => (
          <FileItem key={image.id} image={image} />
        ))}
      </div>
    </div>
  );
}
