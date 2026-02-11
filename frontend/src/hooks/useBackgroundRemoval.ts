'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export type HomeState = 'idle' | 'processing' | 'success' | 'error';

export function useBackgroundRemoval() {
  const [homeState, setHomeState] = useState<HomeState>('idle');
  const [progress, setProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('Analyzing edges and separating subject');
  const [errorMsg, setErrorMsg] = useState("We couldn't process your image. Please try again.");
  const [originalUrl, setOriginalUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetHome = useCallback(() => {
    setHomeState('idle');
    setOriginalUrl('');
    setResultUrl('');
    setProgress(0);
    setCurrentFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const processImage = useCallback(async (file: File) => {
    setHomeState('processing');
    setProgress(0);
    setProcessingStatus('Uploading image...');

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(10);
      setProcessingStatus('Uploading image...');

      const uploadRes = await fetch(`${API_BASE_URL}/api/v1/remove-bg`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Failed to upload image');
      }

      const uploadData = await uploadRes.json();
      const jobId = uploadData.job_id;

      setProgress(30);
      setProcessingStatus('Analyzing edges and separating subject...');

      const poll = async () => {
        try {
          const statusRes = await fetch(`${API_BASE_URL}/api/v1/status/${jobId}`);
          if (!statusRes.ok) throw new Error('Status check failed');

          const statusData = await statusRes.json();
          const jobProgress = Math.max(30, Math.min(95, statusData.progress || 30));
          setProgress(jobProgress);

          if (statusData.status === 'completed') {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setProgress(100);
            setProcessingStatus('Done!');

            const imageId = statusData.images?.[0]?.image_id;
            if (imageId) {
              const downloadUrl = `${API_BASE_URL}/api/v1/download/${jobId}/${imageId}`;
              setResultUrl(downloadUrl);
            }

            setTimeout(() => {
              setHomeState('success');
            }, 500);
          } else if (statusData.status === 'failed') {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            const errorMessage = statusData.images?.[0]?.error || 'Processing failed';
            throw new Error(errorMessage);
          } else {
            if (jobProgress > 50) {
              setProcessingStatus('Refining edges...');
            } else {
              setProcessingStatus('Analyzing edges and separating subject...');
            }
          }
        } catch (err) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setErrorMsg(err instanceof Error ? err.message : 'Processing failed');
          setHomeState('error');
        }
      };

      pollRef.current = setInterval(poll, 1000);
      poll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setHomeState('error');
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file');
      setHomeState('error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Image must be smaller than 20MB');
      setHomeState('error');
      return;
    }
    setCurrentFileName(file.name);
    processImage(file);
  }, [processImage]);

  const downloadResult = useCallback(async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clearcut-' + (currentFileName || 'image.png');
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(resultUrl, '_blank');
    }
  }, [resultUrl, currentFileName]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return {
    homeState,
    progress,
    processingStatus,
    originalUrl,
    resultUrl,
    errorMsg,
    currentFileName,
    fileInputRef,
    handleFile,
    downloadResult,
    resetHome,
  };
}
