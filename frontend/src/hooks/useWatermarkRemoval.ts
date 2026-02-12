'use client';

import { useCallback, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { removeWatermark, getJobStatus } from '@/lib/api';
import { loadImage } from '@/lib/canvasCompositor';
import { SubjectLayer } from '@/lib/layers';

export function useWatermarkRemoval() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  const startRemoval = useCallback(async () => {
    const store = useEditorStore.getState();
    const subject = store.layers.find((l) => l.type === 'subject') as SubjectLayer | undefined;
    if (!subject?.imageElement) return;

    // Extract subject as PNG blob using the original image if available
    const sourceImg = subject.originalImageElement || subject.imageElement;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sourceImg.naturalWidth;
    tempCanvas.height = sourceImg.naturalHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(sourceImg, 0, 0);

    let blob: Blob | null;
    try {
      blob = await new Promise<Blob | null>((resolve) =>
        tempCanvas.toBlob(resolve, 'image/png')
      );
    } catch {
      store.setWatermarkRemovalError('Failed to extract image');
      store.setWatermarkRemovalStatus('failed');
      return;
    }

    if (!blob) {
      store.setWatermarkRemovalError('Failed to extract image');
      store.setWatermarkRemovalStatus('failed');
      return;
    }

    // Upload
    store.setWatermarkRemovalStatus('uploading');
    store.setWatermarkRemovalError(null);

    let jobId: string;
    try {
      const response = await removeWatermark(blob, 'watermark-removal.png');
      jobId = response.job_id;
    } catch (err) {
      store.setWatermarkRemovalError(err instanceof Error ? err.message : 'Upload failed');
      store.setWatermarkRemovalStatus('failed');
      return;
    }

    store.setWatermarkRemovalStatus('processing');
    store.setWatermarkRemovalJobId(jobId);

    // Poll for completion
    cleanup();
    intervalRef.current = setInterval(async () => {
      try {
        const status = await getJobStatus(jobId);
        const image = status.images[0];
        if (!image) return;

        if (image.status === 'completed' && image.download_url) {
          cleanup();
          try {
            const newImg = await loadImage(image.download_url);
            useEditorStore.getState().replaceSubjectImage(newImg);
            useEditorStore.getState().setWatermarkRemovalStatus('completed');

            // Auto-reset to idle after 3s
            resetTimeoutRef.current = setTimeout(() => {
              useEditorStore.getState().setWatermarkRemovalStatus('idle');
              useEditorStore.getState().setWatermarkRemovalJobId(null);
            }, 3000);
          } catch {
            useEditorStore.getState().setWatermarkRemovalError('Failed to load cleaned image');
            useEditorStore.getState().setWatermarkRemovalStatus('failed');
          }
        } else if (image.status === 'failed') {
          cleanup();
          useEditorStore.getState().setWatermarkRemovalError(image.error || 'Watermark removal failed');
          useEditorStore.getState().setWatermarkRemovalStatus('failed');
        }
      } catch {
        // Network error during poll — keep trying
      }
    }, 1000);
  }, [cleanup]);

  const cancelRemoval = useCallback(() => {
    cleanup();
    useEditorStore.getState().setWatermarkRemovalStatus('idle');
    useEditorStore.getState().setWatermarkRemovalError(null);
    useEditorStore.getState().setWatermarkRemovalJobId(null);
  }, [cleanup]);

  return { startRemoval, cancelRemoval };
}
