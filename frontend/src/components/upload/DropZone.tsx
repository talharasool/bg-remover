'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImageUpload } from '@/hooks/useImageUpload';

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 20;

export default function DropZone() {
  const { upload, isUploading, error, clearError } = useImageUpload();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      clearError();
      if (acceptedFiles.length > 0) {
        upload(acceptedFiles);
      }
    },
    [upload, clearError]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES,
    disabled: isUploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative group cursor-pointer
          rounded-3xl border-2 border-dashed
          transition-all duration-400 ease-smooth
          ${isDragActive && !isDragReject
            ? 'border-accent bg-accent/5 scale-[1.01]'
            : 'border-slate-200 hover:border-accent/50 hover:bg-slate-50/50'}
          ${isDragReject ? 'border-red-400 bg-red-50/50' : ''}
          ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center py-16 px-8">
          {/* Animated icon */}
          <div className={`
            relative mb-6 transition-transform duration-400 ease-smooth
            ${isDragActive ? 'scale-110' : 'group-hover:scale-105'}
          `}>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-violet/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

            {/* Icon container */}
            <div className={`
              relative w-20 h-20 rounded-2xl
              bg-gradient-to-br from-accent/10 to-violet/10
              flex items-center justify-center
              transition-all duration-400
              ${isDragActive ? 'from-accent/20 to-violet/20' : ''}
            `}>
              <svg
                className={`w-9 h-9 transition-colors duration-300 ${isDragActive ? 'text-accent' : 'text-slate-400 group-hover:text-accent'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Text content */}
          {isDragActive ? (
            <div className="text-center animate-fade-in">
              <p className="text-subtitle text-accent font-medium">
                Drop to upload
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-subtitle text-slate-700 mb-2">
                Drop your images here
              </p>
              <p className="text-caption text-slate-400 mb-4">
                or click to browse
              </p>
              <div className="flex items-center gap-2 text-tiny text-slate-400">
                <span className="px-2 py-1 bg-slate-100 rounded-lg">JPG</span>
                <span className="px-2 py-1 bg-slate-100 rounded-lg">PNG</span>
                <span className="px-2 py-1 bg-slate-100 rounded-lg">WEBP</span>
                <span className="text-slate-300">•</span>
                <span>Up to 20MB</span>
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-3xl">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-200" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                </div>
                <span className="text-caption font-medium text-slate-600">
                  Uploading...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl animate-fade-in">
          <p className="text-caption text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
