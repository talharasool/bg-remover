'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useImageStore } from '@/store/imageStore';
import { downloadImage } from '@/lib/api';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';

export default function BulkDownload() {
  const { images } = useImageStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const completedImages = images.filter((img) => img.status === 'completed');

  const handleBulkDownload = async () => {
    if (completedImages.length === 0) return;

    setIsDownloading(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const folder = zip.folder('processed-images');

      if (!folder) throw new Error('Failed to create ZIP folder');

      for (let i = 0; i < completedImages.length; i++) {
        const image = completedImages[i];
        if (!image.jobId || !image.imageId) continue;

        const blob = await downloadImage(image.jobId, image.imageId);
        const baseName = image.file.name.replace(/\.[^/.]+$/, '');
        folder.file(`${baseName}_no_bg.png`, blob);

        setProgress(((i + 1) / completedImages.length) * 100);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'processed-images.zip');
    } catch (error) {
      console.error('Bulk download failed:', error);
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  if (completedImages.length < 2) {
    return null;
  }

  return (
    <div className="w-full">
      {isDownloading ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Creating ZIP...</span>
            <span className="text-gray-500">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      ) : (
        <Button
          onClick={handleBulkDownload}
          className="w-full"
          variant="primary"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download All ({completedImages.length} images)
        </Button>
      )}
    </div>
  );
}
