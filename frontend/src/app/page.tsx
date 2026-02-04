'use client';

import { useEffect } from 'react';
import DropZone from '@/components/upload/DropZone';
import FileList from '@/components/upload/FileList';
import ImageGrid from '@/components/preview/ImageGrid';
import BulkDownload from '@/components/download/BulkDownload';
import { useJobStatus } from '@/hooks/useJobStatus';
import { useImageStore } from '@/store/imageStore';
import Card from '@/components/ui/Card';
import Progress from '@/components/ui/Progress';

export default function Home() {
  const { images } = useImageStore();
  const { processingCount, completedCount, failedCount, allComplete } = useJobStatus();

  const totalCount = images.length;
  const hasImages = totalCount > 0;
  const isProcessing = processingCount > 0;

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Background Remover
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Remove backgrounds from images automatically using AI.
            Free, fast, and easy to use.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <DropZone />

          {hasImages && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              {/* Progress Summary */}
              {isProcessing && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      Processing {processingCount} of {totalCount} images...
                    </span>
                    <span className="text-gray-500">
                      {completedCount} completed
                      {failedCount > 0 && `, ${failedCount} failed`}
                    </span>
                  </div>
                  <Progress
                    value={completedCount + failedCount}
                    max={totalCount}
                  />
                </div>
              )}

              {/* Success Message */}
              {allComplete && totalCount > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    {completedCount === totalCount
                      ? `All ${completedCount} images processed successfully!`
                      : `Processed ${completedCount} of ${totalCount} images. ${failedCount} failed.`}
                  </p>
                </div>
              )}

              <FileList />

              {/* Bulk Download */}
              {completedCount >= 2 && (
                <div className="mt-4">
                  <BulkDownload />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Preview Grid */}
        {hasImages && (
          <Card>
            <ImageGrid />
          </Card>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Private & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>AI-Powered (U2-Net)</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
