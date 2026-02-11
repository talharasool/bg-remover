import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useBackgroundRemoval', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useBackgroundRemoval());
    expect(result.current.homeState).toBe('idle');
    expect(result.current.progress).toBe(0);
  });

  it('rejects non-image files', () => {
    const { result } = renderHook(() => useBackgroundRemoval());
    const textFile = new File(['hello'], 'test.txt', { type: 'text/plain' });

    act(() => {
      result.current.handleFile(textFile);
    });

    expect(result.current.homeState).toBe('error');
    expect(result.current.errorMsg).toContain('image file');
  });

  it('rejects files over 20MB', () => {
    const { result } = renderHook(() => useBackgroundRemoval());
    const bigFile = new File([new ArrayBuffer(21 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.handleFile(bigFile);
    });

    expect(result.current.homeState).toBe('error');
    expect(result.current.errorMsg).toContain('20MB');
  });

  it('resets state correctly', async () => {
    const { result } = renderHook(() => useBackgroundRemoval());

    // Set error state first
    act(() => {
      result.current.handleFile(new File(['x'], 'test.txt', { type: 'text/plain' }));
    });
    expect(result.current.homeState).toBe('error');

    // Reset
    act(() => {
      result.current.resetHome();
    });
    expect(result.current.homeState).toBe('idle');
    expect(result.current.progress).toBe(0);
    expect(result.current.originalUrl).toBe('');
    expect(result.current.resultUrl).toBe('');
  });

  it('transitions to processing state on valid upload', async () => {
    // Mock successful upload
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ job_id: 'job-1', message: 'ok', total_images: 1 }),
    });
    // Mock status polling — return pending
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'pending',
        progress: 0.5,
        images: [{ image_id: 'img-1', status: 'pending' }],
      }),
    });

    const { result } = renderHook(() => useBackgroundRemoval());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      result.current.handleFile(file);
    });

    expect(result.current.homeState).toBe('processing');
  });
});
