'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshSvg, DownloadSvg } from '../icons/Icons';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';
import { useCanvasDrag } from '@/hooks/useCanvasDrag';
import { useRetouchBrush } from '@/hooks/useRetouchBrush';
import { useEditorStore } from '@/store/editorStore';
import { loadImage } from '@/lib/canvasCompositor';
import { SubjectLayer } from '@/lib/layers';
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
  const [brushCursor, setBrushCursor] = useState<{ x: number; y: number } | null>(null);

  const retouchMode = useEditorStore((s) => s.retouchMode);
  const retouchTool = useEditorStore((s) => s.retouchTool);
  const brushSize = useEditorStore((s) => s.brushSize);

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

  const dragHandlers = useCanvasDrag(canvasRef);
  const retouchHandlers = useRetouchBrush(canvasRef);

  // Load original image onto SubjectLayer for restore brush
  useEffect(() => {
    if (!originalUrl || !imageLoaded) return;

    const subject = useEditorStore.getState().getSubject();
    if (!subject || subject.originalImageElement) return;

    loadImage(originalUrl).then((img) => {
      const currentSubject = useEditorStore.getState().getSubject();
      if (currentSubject) {
        useEditorStore.getState().updateLayer(currentSubject.id, { originalImageElement: img } as Partial<SubjectLayer>);
      }
    }).catch(() => {});
  }, [originalUrl, imageLoaded]);

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

  // Merge pointer handlers based on mode
  const pointerHandlers = retouchMode
    ? {
        onPointerDown: retouchHandlers.onPointerDown,
        onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => {
          retouchHandlers.onPointerMove(e);
          // Update brush cursor position
          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            setBrushCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        },
        onPointerUp: retouchHandlers.onPointerUp,
      }
    : {
        onPointerDown: dragHandlers.onPointerDown,
        onPointerMove: dragHandlers.onPointerMove,
        onPointerUp: dragHandlers.onPointerUp,
      };

  // Compute brush cursor display size (CSS pixels)
  const getBrushCursorSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const subject = useEditorStore.getState().getSubject();
    if (!subject?.imageElement) return 0;

    const img = subject.imageElement;
    const canvasW = canvas.width;
    const canvasH = canvas.height;
    const scale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
    // brushSize is in image pixels, convert to CSS pixels
    const displayScale = rect.width / canvasW;
    return brushSize * scale * displayScale * 2;
  }, [canvasRef, brushSize]);

  const cursorSize = retouchMode && retouchTool !== 'magic-eraser' ? getBrushCursorSize() : 0;
  const cursorClass = retouchMode
    ? retouchTool === 'magic-eraser' ? 'cursor-crosshair' : 'cursor-none'
    : 'cursor-grab active:cursor-grabbing';

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
          <div
            className="relative rounded-2xl overflow-hidden bg-surface shadow-[0_25px_50px_rgba(0,0,0,0.5)] transition-all duration-400 ease-bounce hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
            onMouseLeave={() => setBrushCursor(null)}
          >
            <span className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-[10px] rounded-lg text-xs font-semibold uppercase tracking-[0.05em] text-accent-2 z-10">Result</span>
            {imageLoaded ? (
              <>
                <canvas
                  ref={canvasRef}
                  className={`max-h-[450px] max-w-full block canvas-no-touch ${cursorClass}`}
                  onPointerDown={pointerHandlers.onPointerDown}
                  onPointerMove={pointerHandlers.onPointerMove}
                  onPointerUp={pointerHandlers.onPointerUp}
                />
                {/* Brush cursor overlay */}
                {retouchMode && retouchTool !== 'magic-eraser' && brushCursor && cursorSize > 0 && (
                  <div
                    className="absolute rounded-full border-2 border-white/60 mix-blend-difference pointer-events-none"
                    style={{
                      width: cursorSize,
                      height: cursorSize,
                      left: brushCursor.x - cursorSize / 2,
                      top: brushCursor.y - cursorSize / 2,
                    }}
                  />
                )}
              </>
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
          onUndo={retouchHandlers.handleUndo}
          onRedo={retouchHandlers.handleRedo}
          canUndo={retouchHandlers.canUndo}
          canRedo={retouchHandlers.canRedo}
        />
      )}
    </div>
  );
}
