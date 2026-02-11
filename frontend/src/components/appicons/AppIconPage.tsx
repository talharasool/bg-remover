'use client';

import { useState, useRef, useCallback } from 'react';
import { APP_ICON_PLATFORMS, PlatformIconSet, renderIconAtSize } from '@/lib/appIcons';
import JSZip from 'jszip';

export default function AppIconPage() {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(['ios', 'android', 'web'])
  );
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSourceImage(img);
      setSourceUrl(url);
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedPlatforms(new Set(APP_ICON_PLATFORMS.map((p) => p.id)));
  const deselectAll = () => setSelectedPlatforms(new Set());

  const totalIcons = APP_ICON_PLATFORMS.filter((p) =>
    selectedPlatforms.has(p.id)
  ).reduce((sum, p) => sum + p.icons.length, 0);

  const handleExport = useCallback(async () => {
    if (!sourceImage || selectedPlatforms.size === 0) return;

    setExporting(true);
    setProgress(0);

    try {
      // Draw source to a canvas first
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = sourceImage.naturalWidth;
      sourceCanvas.height = sourceImage.naturalHeight;
      const sCtx = sourceCanvas.getContext('2d')!;
      sCtx.drawImage(sourceImage, 0, 0);

      const zip = new JSZip();
      let done = 0;
      const total = totalIcons;

      const platforms = APP_ICON_PLATFORMS.filter((p) =>
        selectedPlatforms.has(p.id)
      );

      for (const platform of platforms) {
        const folder = zip.folder(platform.id)!;

        for (const icon of platform.icons) {
          const iconCanvas = renderIconAtSize(sourceCanvas, icon.size);

          const blob = await new Promise<Blob>((resolve, reject) => {
            iconCanvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
              'image/png'
            );
          });

          const parts = icon.filename.split('/');
          if (parts.length > 1) {
            const subFolder = folder.folder(parts.slice(0, -1).join('/'))!;
            subFolder.file(parts[parts.length - 1], blob);
          } else {
            folder.file(icon.filename, blob);
          }

          done++;
          setProgress(Math.round((done / total) * 100));
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'app-icons.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }, [sourceImage, selectedPlatforms, totalIcons]);

  const handleReset = () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceImage(null);
    setSourceUrl(null);
    setProgress(0);
    setExporting(false);
  };

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Hero */}
      <div className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          App Icon{' '}
          <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            Generator
          </span>
        </h1>
        <p className="text-lg text-text-muted max-w-lg mx-auto">
          Upload a square image and generate perfectly sized icons for iOS,
          Android, macOS, watchOS, and Web — all in one click.
        </p>
      </div>

      {/* Upload / Preview */}
      {!sourceImage ? (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
            dragOver
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/40 hover:bg-surface-light'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </div>
          <p className="text-text font-medium mb-1">
            Drop your icon image here or click to upload
          </p>
          <p className="text-sm text-text-muted">
            Recommended: 1024x1024 PNG (square)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Preview + change */}
          <div className="flex items-center gap-6 p-5 bg-surface rounded-2xl border border-border">
            <img
              src={sourceUrl!}
              alt="Source icon"
              className="w-24 h-24 rounded-2xl object-cover border border-border"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Source Image</p>
              <p className="text-xs text-text-muted mt-0.5">
                {sourceImage.naturalWidth} x {sourceImage.naturalHeight} px
              </p>
              {sourceImage.naturalWidth !== sourceImage.naturalHeight && (
                <p className="text-xs text-[#ff6b6b] mt-1">
                  Image is not square — icons will be center-cropped
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-surface text-text-muted hover:text-text hover:border-border-light cursor-pointer transition-all duration-200 font-[inherit]"
            >
              Change
            </button>
          </div>

          {/* Platform selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">
                Select Platforms
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-accent hover:text-accent-2 cursor-pointer font-[inherit]"
                >
                  All
                </button>
                <span className="text-xs text-text-dim">/</span>
                <button
                  onClick={deselectAll}
                  className="text-xs text-accent hover:text-accent-2 cursor-pointer font-[inherit]"
                >
                  None
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {APP_ICON_PLATFORMS.map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  selected={selectedPlatforms.has(platform.id)}
                  onToggle={() => togglePlatform(platform.id)}
                />
              ))}
            </div>
          </div>

          {/* Export bar */}
          <div className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-border">
            <div>
              <p className="text-sm font-medium text-text">
                {selectedPlatforms.size} platform
                {selectedPlatforms.size !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {totalIcons} icon{totalIcons !== 1 ? 's' : ''} will be generated
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={selectedPlatforms.size === 0 || exporting}
              className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border-none cursor-pointer transition-all duration-300 font-[inherit] ${
                selectedPlatforms.size > 0 && !exporting
                  ? 'bg-accent text-white hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--color-accent-glow)]'
                  : 'bg-surface-light text-text-dim cursor-not-allowed'
              }`}
            >
              {exporting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating... {progress}%
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Export as ZIP
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformCard({
  platform,
  selected,
  onToggle,
}: {
  platform: PlatformIconSet;
  selected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        selected
          ? 'border-accent/40 bg-accent/5'
          : 'border-border bg-surface'
      }`}
    >
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggle}
      >
        {/* Checkbox */}
        <div
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
            selected
              ? 'bg-accent border-accent'
              : 'border-border-light bg-transparent'
          }`}
        >
          {selected && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </div>

        {/* Platform icon */}
        <div className="w-9 h-9 rounded-lg bg-surface-light border border-border flex items-center justify-center flex-shrink-0">
          <PlatformIcon id={platform.id} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text">{platform.name}</p>
          <p className="text-xs text-text-muted">{platform.description}</p>
        </div>

        {/* Count + expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-xs text-text-dim hover:text-text-muted px-2 py-1 rounded cursor-pointer font-[inherit] transition-colors"
        >
          {platform.icons.length} sizes {expanded ? '\u25B4' : '\u25BE'}
        </button>
      </div>

      {/* Expanded icon list */}
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {platform.icons.map((icon) => (
              <div
                key={icon.filename}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-light/50 text-xs"
              >
                <span className="text-text-muted truncate">{icon.label}</span>
                <span className="text-text-dim ml-2 flex-shrink-0 font-mono">
                  {icon.size}px
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformIcon({ id }: { id: string }) {
  const cls = 'w-5 h-5 text-text-muted';

  switch (id) {
    case 'ios':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      );
    case 'android':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 006 7h12c0-2.21-1.2-4.15-2.97-5.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
        </svg>
      );
    case 'macos':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-6l1 2h1c.55 0 1 .45 1 1s-.45 1-1 1H8c-.55 0-1-.45-1-1s.45-1 1-1h1l1-2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v10h16V6H4z" />
        </svg>
      );
    case 'watchos':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 2H7.5L6 7h12l-1.5-5zM6 17l1.5 5h9L18 17H6zM20 9V7H4v2c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2v2h16v-2c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2z" />
        </svg>
      );
    case 'web':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    default:
      return null;
  }
}
