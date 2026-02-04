import { useCallback, useState } from 'react';
import { uploadImage, uploadImages } from '@/lib/api';
import { useImageStore } from '@/store/imageStore';

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addImages, setJobInfo, updateImageStatus } = useImageStore();

  const upload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    // Add images to store
    const store = useImageStore.getState();
    const newImages = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading' as const,
    }));

    // Manually add to store
    useImageStore.setState((state) => ({
      images: [...state.images, ...newImages],
    }));

    const fileIds = newImages.map((img) => img.id);

    try {
      let response;

      if (files.length === 1) {
        response = await uploadImage(files[0]);
      } else {
        response = await uploadImages(files);
      }

      // Get job status to get image IDs
      const { getJobStatus } = await import('@/lib/api');
      const status = await getJobStatus(response.job_id);
      const imageIds = status.images.map((img) => img.image_id);

      // Update store with job info
      setJobInfo(fileIds, response.job_id, imageIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);

      // Mark all images as failed
      fileIds.forEach((id) => {
        updateImageStatus(id, { status: 'failed', error: errorMessage });
      });
    } finally {
      setIsUploading(false);
    }
  }, [setJobInfo, updateImageStatus]);

  return {
    upload,
    isUploading,
    error,
    clearError: () => setError(null),
  };
}
