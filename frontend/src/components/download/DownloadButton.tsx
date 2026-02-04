'use client';

import { useState } from 'react';
import { UploadedImage } from '@/store/imageStore';
import { downloadImage } from '@/lib/api';
import { saveAs } from 'file-saver';
import Button from '@/components/ui/Button';

interface DownloadButtonProps {
  image: UploadedImage;
}

export default function DownloadButton({ image }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!image.jobId || !image.imageId) return;

    setIsDownloading(true);
    try {
      const blob = await downloadImage(image.jobId, image.imageId);
      const baseName = image.file.name.replace(/\.[^/.]+$/, '');
      saveAs(blob, `${baseName}_no_bg.png`);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (image.status !== 'completed') {
    return null;
  }

  return (
    <Button
      size="sm"
      onClick={handleDownload}
      isLoading={isDownloading}
    >
      <svg
        className="w-4 h-4 mr-1"
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
      Download
    </Button>
  );
}
