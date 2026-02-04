import { create } from 'zustand';
import { ImageResult, StatusResponse } from '@/lib/api';

// Fallback UUID generator for non-HTTPS contexts
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  jobId?: string;
  imageId?: string;
  status: 'uploading' | 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}

interface ImageStore {
  images: UploadedImage[];
  activeJobId: string | null;

  // Actions
  addImages: (files: File[]) => void;
  updateImageStatus: (id: string, update: Partial<UploadedImage>) => void;
  setJobInfo: (fileIds: string[], jobId: string, imageIds: string[]) => void;
  updateFromJobStatus: (status: StatusResponse) => void;
  removeImage: (id: string) => void;
  clearAll: () => void;
  setActiveJobId: (jobId: string | null) => void;
}

export const useImageStore = create<ImageStore>((set, get) => ({
  images: [],
  activeJobId: null,

  addImages: (files: File[]) => {
    const newImages: UploadedImage[] = files.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading',
    }));

    set((state) => ({
      images: [...state.images, ...newImages],
    }));

    return newImages.map((img) => img.id);
  },

  updateImageStatus: (id: string, update: Partial<UploadedImage>) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...update } : img
      ),
    }));
  },

  setJobInfo: (fileIds: string[], jobId: string, imageIds: string[]) => {
    set((state) => ({
      images: state.images.map((img) => {
        const index = fileIds.indexOf(img.id);
        if (index !== -1) {
          return {
            ...img,
            jobId,
            imageId: imageIds[index],
            status: 'pending' as const,
          };
        }
        return img;
      }),
      activeJobId: jobId,
    }));
  },

  updateFromJobStatus: (status: StatusResponse) => {
    set((state) => ({
      images: state.images.map((img) => {
        if (img.jobId !== status.job_id) return img;

        const imageResult = status.images.find(
          (result) => result.image_id === img.imageId
        );

        if (!imageResult) return img;

        return {
          ...img,
          status: imageResult.status,
          downloadUrl: imageResult.download_url || undefined,
          error: imageResult.error || undefined,
        };
      }),
    }));
  },

  removeImage: (id: string) => {
    const image = get().images.find((img) => img.id === id);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }

    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
    }));
  },

  clearAll: () => {
    const images = get().images;
    images.forEach((img) => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });

    set({ images: [], activeJobId: null });
  },

  setActiveJobId: (jobId: string | null) => {
    set({ activeJobId: jobId });
  },
}));
