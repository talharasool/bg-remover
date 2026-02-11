'use client';

import { useState, useCallback } from 'react';

type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';

interface ExportDialogProps {
  canvasWidth: number;
  canvasHeight: number;
  currentFileName: string;
  onExport: (format: ExportFormat, quality: number, width: number, height: number, fileName: string) => void;
  onClose: () => void;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; ext: string }[] = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
];

export default function ExportDialog({
  canvasWidth,
  canvasHeight,
  currentFileName,
  onExport,
  onClose,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('image/png');
  const [quality, setQuality] = useState(0.9);
  const [width, setWidth] = useState(canvasWidth);
  const [height, setHeight] = useState(canvasHeight);
  const [lockAspect, setLockAspect] = useState(true);

  const aspectRatio = canvasWidth / canvasHeight;

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      setWidth(newWidth);
      if (lockAspect) {
        setHeight(Math.round(newWidth / aspectRatio));
      }
    },
    [lockAspect, aspectRatio]
  );

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      setHeight(newHeight);
      if (lockAspect) {
        setWidth(Math.round(newHeight * aspectRatio));
      }
    },
    [lockAspect, aspectRatio]
  );

  const handleDownload = () => {
    const ext = FORMAT_OPTIONS.find((f) => f.value === format)?.ext || 'png';
    const baseName = currentFileName?.replace(/\.[^.]+$/, '') || 'image';
    const fileName = `clearcut-${baseName}.${ext}`;
    onExport(format, quality, width, height, fileName);
    onClose();
  };

  const showQuality = format !== 'image/png';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.5)] p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-text">Export Image</h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text w-8 h-8 flex items-center justify-center cursor-pointer bg-transparent border-none text-lg font-[inherit]"
          >
            ✕
          </button>
        </div>

        {/* Format */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Format</label>
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] ${
                  format === opt.value
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-surface-light border-border text-text-muted hover:text-text'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quality (JPEG/WebP only) */}
        {showQuality && (
          <div className="mb-4">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(quality * 100)}
              onChange={(e) => setQuality(+e.target.value / 100)}
              className="w-full accent-accent"
            />
          </div>
        )}

        {/* Dimensions */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Dimensions</label>
            <button
              onClick={() => setLockAspect(!lockAspect)}
              className={`text-xs px-2 py-1 rounded border cursor-pointer transition-all duration-200 font-[inherit] ${
                lockAspect
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-surface-light border-border text-text-muted'
              }`}
            >
              {lockAspect ? 'Locked' : 'Unlocked'}
            </button>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="text-xs text-text-dim mb-1 block">Width</label>
              <input
                type="number"
                value={width}
                min={1}
                max={8192}
                onChange={(e) => handleWidthChange(Math.max(1, +e.target.value))}
                className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-text text-sm font-[inherit] outline-none focus:border-accent"
              />
            </div>
            <span className="text-text-muted mt-5">×</span>
            <div className="flex-1">
              <label className="text-xs text-text-dim mb-1 block">Height</label>
              <input
                type="number"
                value={height}
                min={1}
                max={8192}
                onChange={(e) => handleHeightChange(Math.max(1, +e.target.value))}
                className="w-full px-3 py-2 bg-surface-light border border-border rounded-lg text-text text-sm font-[inherit] outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="w-full px-5 py-3 text-[15px] font-semibold rounded-[10px] border-none bg-accent text-white cursor-pointer transition-all duration-300 ease-bounce hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--color-accent-glow)] font-[inherit]"
        >
          Download
        </button>
      </div>
    </div>
  );
}
