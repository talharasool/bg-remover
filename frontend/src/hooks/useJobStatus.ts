import { useEffect, useRef } from 'react';
import { getJobStatus } from '@/lib/api';
import { useImageStore } from '@/store/imageStore';

const POLL_INTERVAL = 1000; // 1 second

export function useJobStatus() {
  const { activeJobId, updateFromJobStatus, images } = useImageStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!activeJobId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const status = await getJobStatus(activeJobId);
        updateFromJobStatus(status);

        // Stop polling when job is complete
        if (status.status === 'completed' || status.status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Failed to get job status:', error);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeJobId, updateFromJobStatus]);

  // Check if all images are complete
  const allComplete = images.every(
    (img) => img.status === 'completed' || img.status === 'failed'
  );

  const processingCount = images.filter(
    (img) => img.status === 'processing' || img.status === 'pending'
  ).length;

  const completedCount = images.filter(
    (img) => img.status === 'completed'
  ).length;

  const failedCount = images.filter(
    (img) => img.status === 'failed'
  ).length;

  return {
    isPolling: !!intervalRef.current,
    allComplete,
    processingCount,
    completedCount,
    failedCount,
  };
}
