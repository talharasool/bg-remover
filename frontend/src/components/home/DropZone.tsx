'use client';

import { useRef, useState, useCallback } from 'react';
import { PlusSvg } from '../icons/Icons';

interface DropZoneProps {
  onFile: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export default function DropZone({ onFile, fileInputRef }: DropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mouse-x', x + '%');
    e.currentTarget.style.setProperty('--mouse-y', y + '%');
  }, []);

  return (
    <div
      ref={dropzoneRef}
      className={`dropzone-glow relative bg-surface border-2 border-dashed rounded-3xl px-8 md:px-15 py-20 text-center cursor-pointer transition-all duration-400 ease-bounce
        ${dragActive
          ? 'border-accent-2 bg-[rgba(0,212,170,0.05)] scale-[1.02]'
          : 'border-border hover:border-accent hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3),0_0_40px_var(--color-accent-glow)]'
        }`}
      onMouseMove={handleMouseMove}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files.length) onFile(e.dataTransfer.files[0]);
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className={`w-[100px] h-[100px] mx-auto mb-8 bg-surface-light rounded-[28px] flex items-center justify-center relative transition-all duration-400 ease-bounce group-hover:scale-110 ${dragActive ? '' : ''}`}>
        <span className="w-10 h-10 text-accent transition-colors duration-300">
          <PlusSvg />
        </span>
      </div>
      <div className="text-[28px] font-semibold mb-3 relative z-1">Drop your image here</div>
      <div className="text-base text-text-muted relative z-1">or click anywhere to browse</div>
      <div className="mt-6 text-[13px] text-text-muted flex items-center justify-center gap-6 relative z-1">
        <span className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4"/></svg>
          JPG, PNG, WebP
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Up to 20MB
        </span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFile(e.target.files[0]);
        }}
      />
    </div>
  );
}
