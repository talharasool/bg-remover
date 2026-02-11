import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadImage, uploadImages, getJobStatus, getDownloadUrl, downloadImage } from '@/lib/api';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('uploadImage', () => {
    it('sends POST with FormData and returns response', async () => {
      const mockResponse = { job_id: 'job-1', message: 'ok', total_images: 1 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadImage(file);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/api/v1/remove-bg');
      expect(options.method).toBe('POST');
      expect(options.body).toBeInstanceOf(FormData);
      expect(result).toEqual(mockResponse);
    });

    it('throws on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'File too large' }),
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await expect(uploadImage(file)).rejects.toThrow('File too large');
    });
  });

  describe('uploadImages', () => {
    it('sends POST with multiple files', async () => {
      const mockResponse = { job_id: 'job-2', message: 'ok', total_images: 2 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const files = [
        new File(['a'], 'a.jpg', { type: 'image/jpeg' }),
        new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
      ];
      const result = await uploadImages(files);

      expect(result).toEqual(mockResponse);
      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.getAll('files')).toHaveLength(2);
    });

    it('throws on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Too many files' }),
      });

      await expect(uploadImages([])).rejects.toThrow('Too many files');
    });
  });

  describe('getJobStatus', () => {
    it('fetches job status', async () => {
      const mockStatus = {
        job_id: 'job-1',
        status: 'completed',
        progress: 1.0,
        images: [],
        completed_count: 1,
        total_count: 1,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await getJobStatus('job-1');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/status/job-1'));
      expect(result).toEqual(mockStatus);
    });

    it('throws on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Job not found' }),
      });

      await expect(getJobStatus('bad-id')).rejects.toThrow('Job not found');
    });
  });

  describe('getDownloadUrl', () => {
    it('returns correct URL', () => {
      const url = getDownloadUrl('job-1', 'img-1');
      expect(url).toContain('/api/v1/download/job-1/img-1');
    });
  });

  describe('downloadImage', () => {
    it('fetches and returns blob', async () => {
      const mockBlob = new Blob(['image data'], { type: 'image/png' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await downloadImage('job-1', 'img-1');
      expect(result).toBe(mockBlob);
    });

    it('throws on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Not found' }),
      });

      await expect(downloadImage('job-1', 'img-1')).rejects.toThrow('Not found');
    });
  });
});
