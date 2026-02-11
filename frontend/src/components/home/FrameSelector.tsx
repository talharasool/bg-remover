'use client';

import { FRAME_PRESETS, type FramePreset } from '@/lib/canvasCompositor';

interface FrameSelectorProps {
  activePreset: FramePreset | null;
  isCustom: boolean;
  customWidth: number;
  customHeight: number;
  onSelectPreset: (preset: FramePreset | null) => void;
  onSelectCustom: () => void;
  onCustomSizeChange: (w: number, h: number) => void;
}

export default function FrameSelector({
  activePreset,
  isCustom,
  customWidth,
  customHeight,
  onSelectPreset,
  onSelectCustom,
  onCustomSizeChange,
}: FrameSelectorProps) {
  const pillBase =
    'px-3 py-2 text-xs font-medium rounded-lg border cursor-pointer transition-all duration-200 text-left';
  const pillActive = 'bg-accent/10 border-accent text-accent';
  const pillInactive = 'bg-surface border-border text-text-muted hover:border-border-light hover:text-text';

  return (
    <div>
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Frame Size
      </h4>
      <div className="flex flex-wrap gap-2">
        {/* Original (no frame) */}
        <button
          onClick={() => onSelectPreset(null)}
          className={`${pillBase} ${!activePreset && !isCustom ? pillActive : pillInactive}`}
        >
          Original
        </button>

        {/* Presets */}
        {FRAME_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => onSelectPreset(preset)}
            className={`${pillBase} ${activePreset?.name === preset.name ? pillActive : pillInactive}`}
          >
            <span className="block">{preset.name}</span>
            <span className="block text-[10px] opacity-60">{preset.width}&times;{preset.height}</span>
          </button>
        ))}

        {/* Custom */}
        <button
          onClick={onSelectCustom}
          className={`${pillBase} ${isCustom ? pillActive : pillInactive}`}
        >
          Custom
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-2 mt-3">
          <input
            type="number"
            value={customWidth}
            min={1}
            max={4096}
            onChange={(e) => onCustomSizeChange(clamp(+e.target.value), customHeight)}
            className="w-20 px-3 py-2 text-sm font-mono bg-surface border border-border rounded-lg text-text focus:outline-none focus:border-accent transition-colors"
          />
          <span className="text-text-muted text-sm">&times;</span>
          <input
            type="number"
            value={customHeight}
            min={1}
            max={4096}
            onChange={(e) => onCustomSizeChange(customWidth, clamp(+e.target.value))}
            className="w-20 px-3 py-2 text-sm font-mono bg-surface border border-border rounded-lg text-text focus:outline-none focus:border-accent transition-colors"
          />
          <span className="text-text-muted text-xs">px</span>
        </div>
      )}
    </div>
  );
}

function clamp(v: number): number {
  return Math.max(1, Math.min(4096, Math.round(v) || 1));
}
