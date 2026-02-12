'use client';

import { useEditorStore } from '@/store/editorStore';
import { useWatermarkRemoval } from '@/hooks/useWatermarkRemoval';

interface RetouchToolsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOLS = [
  { id: 'erase' as const, label: 'Erase', tip: 'Paint to remove areas from the subject' },
  { id: 'restore' as const, label: 'Restore', tip: 'Paint to bring back removed areas' },
  { id: 'magic-eraser' as const, label: 'Magic Eraser', tip: 'Click to auto-erase similar colors' },
  { id: 'watermark-remover' as const, label: 'Watermark', tip: 'Auto-detect and remove watermarks using AI' },
];

export default function RetouchTools({ onUndo, onRedo, canUndo, canRedo }: RetouchToolsProps) {
  const retouchMode = useEditorStore((s) => s.retouchMode);
  const retouchTool = useEditorStore((s) => s.retouchTool);
  const brushSize = useEditorStore((s) => s.brushSize);
  const brushHardness = useEditorStore((s) => s.brushHardness);
  const magicEraserTolerance = useEditorStore((s) => s.magicEraserTolerance);
  const watermarkStatus = useEditorStore((s) => s.watermarkRemovalStatus);
  const watermarkError = useEditorStore((s) => s.watermarkRemovalError);

  const isFullscreen = useEditorStore((s) => s.isFullscreen);
  const setRetouchMode = useEditorStore((s) => s.setRetouchMode);
  const setRetouchTool = useEditorStore((s) => s.setRetouchTool);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const setBrushHardness = useEditorStore((s) => s.setBrushHardness);
  const setMagicEraserTolerance = useEditorStore((s) => s.setMagicEraserTolerance);
  const setFullscreen = useEditorStore((s) => s.setFullscreen);

  const { startRemoval, cancelRemoval } = useWatermarkRemoval();

  const activeTool = TOOLS.find((t) => t.id === retouchTool);

  const showBrushControls = retouchTool !== 'magic-eraser' && retouchTool !== 'watermark-remover';
  const isWatermarkProcessing = watermarkStatus === 'uploading' || watermarkStatus === 'processing';

  return (
    <div className="space-y-4">
      {/* Toggle retouch mode */}
      <button
        onClick={() => setRetouchMode(!retouchMode)}
        className={`w-full px-4 py-3 text-sm font-semibold rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] flex items-center justify-center gap-2 ${
          retouchMode
            ? 'bg-accent/10 border-accent text-accent'
            : 'border-border bg-surface text-text hover:bg-surface-hover hover:border-border-light'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        {retouchMode ? 'Exit Retouch Mode' : 'Enter Retouch Mode'}
      </button>

      {retouchMode && (
        <div className="space-y-4 p-4 bg-surface rounded-xl border border-border">
          {/* Tool selection */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Tool</label>
            <div className="flex gap-1.5">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setRetouchTool(tool.id)}
                  className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] ${
                    retouchTool === tool.id
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-surface-light border-border text-text-muted hover:text-text'
                  }`}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brush size (erase/restore only) */}
          {showBrushControls && (
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                Brush Size: {brushSize}px
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={brushSize}
                onChange={(e) => setBrushSize(+e.target.value)}
                className="w-full accent-accent"
              />
            </div>
          )}

          {/* Brush hardness (erase/restore only) */}
          {showBrushControls && (
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Edge</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBrushHardness('hard')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] ${
                    brushHardness === 'hard'
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-surface-light border-border text-text-muted hover:text-text'
                  }`}
                >
                  Hard
                </button>
                <button
                  onClick={() => setBrushHardness('soft')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] ${
                    brushHardness === 'soft'
                      ? 'bg-accent/10 border-accent text-accent'
                      : 'bg-surface-light border-border text-text-muted hover:text-text'
                  }`}
                >
                  Soft
                </button>
              </div>
            </div>
          )}

          {/* Tolerance (magic eraser only) */}
          {retouchTool === 'magic-eraser' && (
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                Tolerance: {magicEraserTolerance}
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={magicEraserTolerance}
                onChange={(e) => setMagicEraserTolerance(+e.target.value)}
                className="w-full accent-accent"
              />
            </div>
          )}

          {/* Watermark removal UI */}
          {retouchTool === 'watermark-remover' && (
            <div className="space-y-3">
              <p className="text-xs text-text-dim">
                AI will automatically detect and remove watermarks from the subject image.
              </p>

              {watermarkStatus === 'idle' && (
                <button
                  onClick={startRemoval}
                  className="w-full px-4 py-3 text-sm font-semibold rounded-lg border-none bg-accent text-white cursor-pointer transition-all duration-200 font-[inherit] hover:opacity-90"
                >
                  Remove Watermark
                </button>
              )}

              {watermarkStatus === 'uploading' && (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full px-4 py-3 text-sm font-semibold rounded-lg border-none bg-accent/60 text-white cursor-not-allowed font-[inherit] flex items-center justify-center gap-2"
                  >
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Uploading...
                  </button>
                  <button
                    onClick={cancelRemoval}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface-light text-text-muted hover:text-text cursor-pointer transition-all duration-200 font-[inherit]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {watermarkStatus === 'processing' && (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full px-4 py-3 text-sm font-semibold rounded-lg border-none bg-accent/60 text-white cursor-not-allowed font-[inherit] flex items-center justify-center gap-2"
                  >
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Removing watermark...
                  </button>
                  <button
                    onClick={cancelRemoval}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface-light text-text-muted hover:text-text cursor-pointer transition-all duration-200 font-[inherit]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {watermarkStatus === 'completed' && (
                <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center font-semibold">
                  Watermark removed successfully!
                </div>
              )}

              {watermarkStatus === 'failed' && (
                <div className="space-y-2">
                  <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                    {watermarkError || 'Watermark removal failed'}
                  </div>
                  <button
                    onClick={startRemoval}
                    className="w-full px-4 py-3 text-sm font-semibold rounded-lg border-none bg-accent text-white cursor-pointer transition-all duration-200 font-[inherit] hover:opacity-90"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Undo / Redo */}
          <div className="flex gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface-light text-text-muted hover:text-text cursor-pointer transition-all duration-200 font-[inherit] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
              </svg>
              Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface-light text-text-muted hover:text-text cursor-pointer transition-all duration-200 font-[inherit] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.13-9.36L23 10" />
              </svg>
              Redo
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setFullscreen(!isFullscreen)}
            className={`w-full px-3 py-2 text-sm rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] flex items-center justify-center gap-1.5 ${
              isFullscreen
                ? 'bg-accent/10 border-accent text-accent'
                : 'border-border bg-surface-light text-text-muted hover:text-text'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>

          {/* Tool tip */}
          {activeTool && (
            <p className="text-xs text-text-dim text-center">{activeTool.tip}</p>
          )}
        </div>
      )}
    </div>
  );
}
