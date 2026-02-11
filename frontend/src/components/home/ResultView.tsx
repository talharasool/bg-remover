'use client';

import { useState } from 'react';
import { RefreshSvg, DownloadSvg } from '../icons/Icons';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';
import { useCanvasDrag } from '@/hooks/useCanvasDrag';
import EditorPanel from './EditorPanel';

interface ResultViewProps {
  originalUrl: string;
  resultUrl: string;
  currentFileName: string;
  onReset: () => void;
  onDownload: () => void;
}

export default function ResultView({ originalUrl, resultUrl, currentFileName, onReset, onDownload }: ResultViewProps) {
  const [resultTab, setResultTab] = useState<'result' | 'compare'>('result');

  const {
    canvasRef,
    bgColor,
    setBgColor,
    framePreset,
    isCustomFrame,
    customWidth,
    customHeight,
    selectPreset,
    selectCustom,
    setCustomSize,
    hasCustomization,
    imageLoaded,
    downloadComposite,
    resetCustomization,
  } = useCanvasEditor(resultUrl, currentFileName);

  const { onPointerDown, onPointerMove, onPointerUp } = useCanvasDrag(canvasRef);

  const handleDownload = () => {
    if (hasCustomization && imageLoaded) {
      downloadComposite();
    } else {
      onDownload();
    }
  };

  const handleReset = () => {
    resetCustomization();
    onReset();
  };

  return (
    <div className="bg-surface rounded-3xl overflow-hidden border border-border">
      <div className="flex items-center justify-between px-5 md:px-7 py-5 bg-surface-light border-b border-border flex-wrap gap-4">
        <div className="flex bg-surface p-1 rounded-[10px]">
          <button
            className={`px-5 py-2.5 text-sm font-medium border-none rounded-lg cursor-pointer transition-all duration-300 font-[inherit] ${resultTab === 'result' ? 'bg-accent text-white' : 'bg-transparent text-text-muted'}`}
            onClick={() => setResultTab('result')}
          >
            Result
          </button>
          <button
            className={`px-5 py-2.5 text-sm font-medium border-none rounded-lg cursor-pointer transition-all duration-300 font-[inherit] ${resultTab === 'compare' ? 'bg-accent text-white' : 'bg-transparent text-text-muted'}`}
            onClick={() => setResultTab('compare')}
          >
            Original
          </button>
        </div>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[15px] font-semibold rounded-[10px] border border-border bg-surface text-text cursor-pointer transition-all duration-300 ease-bounce hover:bg-surface-light hover:border-border-light font-[inherit]"
            onClick={handleReset}
          >
            <RefreshSvg />
            New Image
          </button>
          <button
            className="inline-flex items-center gap-2 px-5 py-3 text-[15px] font-semibold rounded-[10px] border-none bg-accent text-white cursor-pointer transition-all duration-300 ease-bounce hover:-translate-y-0.5 hover:shadow-[0_10px_30px_var(--color-accent-glow)] font-[inherit]"
            onClick={handleDownload}
          >
            <DownloadSvg />
            Download
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="checkerboard-bg p-6 md:p-15 flex justify-center items-center min-h-[500px]">
        <div className={`flex flex-col md:flex-row gap-10 items-center ${resultTab === 'result' ? '[&>*:first-child]:hidden' : ''}`}>
          <div className="relative rounded-2xl overflow-hidden bg-surface shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-all duration-400 ease-bounce hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <span className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-[10px] rounded-lg text-xs font-semibold uppercase tracking-[0.05em] text-accent">Original</span>
            {originalUrl && <img src={originalUrl} alt="Original" className="max-h-[450px] max-w-full block" />}
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-surface shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-all duration-400 ease-bounce hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <span className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-[10px] rounded-lg text-xs font-semibold uppercase tracking-[0.05em] text-accent-2 z-10">Result</span>
            {imageLoaded ? (
              <canvas
                ref={canvasRef}
                className="max-h-[450px] max-w-full block cursor-grab active:cursor-grabbing canvas-no-touch"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              />
            ) : (
              resultUrl && <img src={resultUrl} alt="Result" className="max-h-[450px] max-w-full block" />
            )}
          </div>
        </div>
      </div>

      {/* Editor panel — visible when Result tab active */}
      {resultTab === 'result' && (
        <EditorPanel
          bgColor={bgColor}
          setBgColor={setBgColor}
          framePreset={framePreset}
          isCustomFrame={isCustomFrame}
          customWidth={customWidth}
          customHeight={customHeight}
          selectPreset={selectPreset}
          selectCustom={selectCustom}
          setCustomSize={setCustomSize}
        />
      )}
    </div>
  );
}
