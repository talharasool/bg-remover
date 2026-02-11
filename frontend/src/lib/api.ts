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

// ---------------------------------------------------------------------------
// API Key Management
// ---------------------------------------------------------------------------

export interface GenerateKeyResponse {
  api_key: string;
  tier: string;
  requests_limit: number;
  message: string;
}

export interface UsageResponse {
  tier: string;
  requests_used: number;
  requests_limit: number;
  remaining_requests: number;
  is_active: boolean;
}

export interface RotateKeyResponse {
  new_api_key: string;
  message: string;
}

export async function generateApiKey(email: string): Promise<GenerateKeyResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/generate-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate API key');
  }

  return response.json();
}

export async function getApiKeyUsage(apiKey: string): Promise<UsageResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/usage?api_key=${encodeURIComponent(apiKey)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get usage');
  }

  return response.json();
}

export async function rotateApiKey(apiKey: string): Promise<RotateKeyResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/rotate-key?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to rotate API key');
  }

  return response.json();
}

export async function revokeApiKey(apiKey: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/revoke-key?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to revoke API key');
  }
}
