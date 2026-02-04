const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ImageResult {
  image_id: string;
  original_filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url: string | null;
  error: string | null;
}

export interface UploadResponse {
  job_id: string;
  message: string;
  total_images: number;
}

export interface StatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  images: ImageResult[];
  completed_count: number;
  total_count: number;
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/remove-bg`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload image');
  }

  return response.json();
}

export async function uploadImages(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE_URL}/api/v1/remove-bg/batch`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload images');
  }

  return response.json();
}

export async function getJobStatus(jobId: string): Promise<StatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/status/${jobId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get job status');
  }

  return response.json();
}

export function getDownloadUrl(jobId: string, imageId: string): string {
  return `${API_BASE_URL}/api/v1/download/${jobId}/${imageId}`;
}

export async function downloadImage(jobId: string, imageId: string): Promise<Blob> {
  const response = await fetch(getDownloadUrl(jobId, imageId));

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to download image');
  }

  return response.blob();
}
