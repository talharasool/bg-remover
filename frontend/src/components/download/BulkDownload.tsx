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
      const folder = zip.folder('background-removed');

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
      saveAs(content, 'background-removed.zip');
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
    <div className="animate-fade-in">
      {isDownloading ? (
        <div className="p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-caption font-medium text-slate-600">
              Creating ZIP file...
            </span>
            <span className="text-tiny text-slate-400">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} />
        </div>
      ) : (
        <Button onClick={handleBulkDownload} variant="primary" size="lg" className="w-full">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download All ({completedImages.length})</span>
        </Button>
      )}
    </div>
  );
}
