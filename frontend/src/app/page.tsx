'use client';

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
  const { processingCount, completedCount, failedCount } = useJobStatus();

  const totalCount = images.length;
  const hasImages = totalCount > 0;
  const isProcessing = processingCount > 0;
  const allComplete = hasImages && processingCount === 0;

  return (
    <main className="min-h-screen py-12 md:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          {/* Logo / Brand mark */}
          <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br from-accent to-violet shadow-lg shadow-accent/25">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-display text-slate-900 mb-4">
            Background{' '}
            <span className="gradient-text">Remover</span>
          </h1>

          <p className="text-body text-slate-500 max-w-md mx-auto">
            Remove backgrounds from your images instantly with AI.
            <br className="hidden sm:block" />
            Free, fast, and beautifully simple.
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Upload Section */}
          <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Card variant="elevated" padding="lg">
              <DropZone />

              {/* Progress & File List */}
              {hasImages && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  {/* Processing Status */}
                  {isProcessing && (
                    <div className="mb-6 animate-fade-in">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-2 h-2 bg-violet-500 rounded-full" />
                            <div className="absolute inset-0 w-2 h-2 bg-violet-500 rounded-full animate-ping" />
                          </div>
                          <span className="text-caption font-medium text-slate-600">
                            Processing {processingCount} of {totalCount}
                          </span>
                        </div>
                        <span className="text-tiny text-slate-400">
                          {completedCount} done
                        </span>
                      </div>
                      <Progress value={completedCount + failedCount} max={totalCount} />
                    </div>
                  )}

                  {/* Success State */}
                  {allComplete && completedCount > 0 && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-caption font-medium text-emerald-700">
                          {completedCount === totalCount
                            ? `All ${completedCount} images processed successfully`
                            : `${completedCount} of ${totalCount} processed`}
                        </p>
                      </div>
                    </div>
                  )}

                  <FileList />

                  {/* Bulk Download */}
                  {completedCount >= 2 && (
                    <div className="mt-6">
                      <BulkDownload />
                    </div>
                  )}
                </div>
              )}
            </Card>
          </section>

          {/* Preview Section */}
          {hasImages && (
            <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-subtitle text-slate-800">Preview</h2>
                {completedCount > 0 && (
                  <span className="text-tiny text-slate-400">
                    Hover to see controls
                  </span>
                )}
              </div>
              <ImageGrid />
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex flex-wrap items-center justify-center gap-6 text-caption text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Private & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>Powered by BiRefNet</span>
            </div>
          </div>

          <p className="mt-6 text-tiny text-slate-300">
            Files are automatically deleted after 24 hours
          </p>
        </footer>
      </div>
    </main>
  );
}
