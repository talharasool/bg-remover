'use client';

import { useState, useRef } from 'react';
import { UploadedImage } from '@/store/imageStore';
import { getDownloadUrl, downloadImage } from '@/lib/api';
import { saveAs } from 'file-saver';
import Spinner from '@/components/ui/Spinner';

interface ImagePreviewProps {
  image: UploadedImage;
  isHero?: boolean;
}

const PRESET_COLORS = [
  { id: 'transparent', value: null, label: 'Transparent' },
  { id: 'white', value: '#ffffff', label: 'White' },
  { id: 'black', value: '#000000', label: 'Black' },
  { id: 'purple', value: '#4f46e5', label: 'Purple' },
  { id: 'pink', value: '#f0a0a0', label: 'Pink' },
  { id: 'yellow', value: '#fde047', label: 'Yellow' },
];

export default function ImagePreview({ image, isHero = false }: ImagePreviewProps) {
  const [showProcessed, setShowProcessed] = useState(true);
  const [selectedBg, setSelectedBg] = useState<string | null>(null); // null = transparent
  const [customColor, setCustomColor] = useState('#ff6b6b');
  const [isDownloading, setIsDownloading] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const processedUrl =
    image.status === 'completed' && image.jobId && image.imageId
      ? getDownloadUrl(image.jobId, image.imageId)
      : null;

  // Download with background color applied
  const handleDownload = async () => {
    if (!image.jobId || !image.imageId || !processedUrl) return;
    setIsDownloading(true);

    try {
      const blob = await downloadImage(image.jobId, image.imageId);
      const baseName = image.file.name.replace(/\.[^/.]+$/, '');

      // If transparent selected, download as-is
      if (selectedBg === null) {
        saveAs(blob, `${baseName}_no_bg.png`);
        return;
      }

      // Otherwise, composite with background color
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
      });

      // Create canvas and draw with background
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Fill background color
        ctx.fillStyle = selectedBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the transparent image on top
        ctx.drawImage(img, 0, 0);

        // Export as PNG
        canvas.toBlob((resultBlob) => {
          if (resultBlob) {
            saveAs(resultBlob, `${baseName}_${selectedBg.replace('#', '')}.png`);
          }
        }, 'image/png');
      }

      URL.revokeObjectURL(img.src);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleColorPickerClick = () => {
    colorInputRef.current?.click();
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setSelectedBg(color);
    setShowProcessed(true);
  };

  const isProcessing = ['uploading', 'pending', 'processing'].includes(image.status);
  const isCustomColorSelected = selectedBg !== null && !PRESET_COLORS.find(c => c.value === selectedBg);

  const getBackgroundStyle = () => {
    if (selectedBg === null) return {};
    return { backgroundColor: selectedBg };
  };

  return (
    <div className={`
      relative bg-white rounded-3xl overflow-hidden
      border border-slate-100 shadow-soft
      transition-all duration-400 ease-smooth
      w-full h-full
      ${isHero ? '' : 'hover:shadow-elevated hover:-translate-y-1'}
    `}>
      {/* Image Container */}
      <div className={`relative ${isHero ? 'aspect-[4/3]' : 'aspect-square'}`}>
        {/* Original Image */}
        <div
          className={`
            absolute inset-0
            transition-opacity duration-400
            ${showProcessed && processedUrl ? 'opacity-0' : 'opacity-100'}
          `}
        >
          <img
            src={image.preview}
            alt={`Original: ${image.file.name}`}
            className="w-full h-full object-contain p-4"
          />
        </div>

        {/* Processed Image with selectable background */}
        {processedUrl && (
          <div
            className={`
              absolute inset-0
              transition-opacity duration-400
              ${showProcessed ? 'opacity-100' : 'opacity-0'}
              ${selectedBg === null ? 'checkerboard' : ''}
            `}
            style={getBackgroundStyle()}
          >
            <img
              src={processedUrl}
              alt={`Processed: ${image.file.name}`}
              className="w-full h-full object-contain p-4"
            />
          </div>
        )}

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-violet/20 rounded-full blur-xl animate-pulse-soft" />
              <Spinner size="lg" />
            </div>
            <div className="text-center">
              <p className="text-caption font-medium text-slate-700 capitalize">
                {image.status === 'processing' ? 'Removing background...' : 'Preparing...'}
              </p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {image.status === 'failed' && (
          <div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-caption text-red-600 text-center">
              {image.error || 'Processing failed'}
            </p>
          </div>
        )}
      </div>

      {/* Controls Bar - only show when completed */}
      {image.status === 'completed' && (
        <div className="px-4 py-4 bg-slate-50/80 border-t border-slate-100">
          <div className="flex items-center justify-between gap-4">
            {/* Background Color Selector */}
            <div className="flex items-center gap-2">
              {/* Preset colors */}
              {PRESET_COLORS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setSelectedBg(bg.value);
                    setShowProcessed(true);
                  }}
                  title={bg.label}
                  className={`
                    relative w-8 h-8 rounded-full transition-all duration-200
                    ${selectedBg === bg.value && !isCustomColorSelected
                      ? 'ring-2 ring-slate-900 ring-offset-2'
                      : 'hover:scale-110'
                    }
                    ${bg.id === 'transparent' ? 'checkerboard border border-slate-200' : ''}
                    ${bg.id === 'white' ? 'border border-slate-200' : ''}
                  `}
                  style={bg.value ? { backgroundColor: bg.value } : {}}
                />
              ))}

              {/* Custom Color Picker */}
              <div className="relative">
                <button
                  onClick={handleColorPickerClick}
                  title="Pick custom color"
                  className={`
                    relative w-8 h-8 rounded-full transition-all duration-200 overflow-hidden
                    ${isCustomColorSelected
                      ? 'ring-2 ring-slate-900 ring-offset-2'
                      : 'hover:scale-110'
                    }
                  `}
                  style={{
                    background: 'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)'
                  }}
                >
                  {isCustomColorSelected && (
                    <div
                      className="absolute inset-1 rounded-full border-2 border-white"
                      style={{ backgroundColor: customColor }}
                    />
                  )}
                </button>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Before/After Toggle */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
              <button
                onClick={() => setShowProcessed(false)}
                className={`
                  px-4 py-1.5 text-tiny font-medium rounded-lg transition-all duration-200
                  ${!showProcessed
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                Before
              </button>
              <button
                onClick={() => setShowProcessed(true)}
                className={`
                  px-4 py-1.5 text-tiny font-medium rounded-lg transition-all duration-200
                  ${showProcessed
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-500 hover:text-slate-700'
                  }
                `}
              >
                After
              </button>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="
              w-full mt-3 flex items-center justify-center gap-2
              px-4 py-2.5 rounded-xl
              bg-gradient-to-r from-accent to-violet
              text-white text-caption font-medium
              hover:shadow-lg hover:shadow-accent/25
              transition-all duration-300
              disabled:opacity-50
            "
          >
            {isDownloading ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            <span>
              {selectedBg === null ? 'Download PNG' : `Download with ${selectedBg === '#ffffff' ? 'White' : selectedBg === '#000000' ? 'Black' : 'Color'} BG`}
            </span>
          </button>
        </div>
      )}

      {/* Filename badge - only when processing or failed */}
      {(isProcessing || image.status === 'failed') && (
        <div className="absolute top-3 left-3 max-w-[calc(100%-24px)]">
          <span className="inline-block px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-lg text-tiny text-white/90 truncate max-w-full">
            {image.file.name}
          </span>
        </div>
      )}
    </div>
  );
}
