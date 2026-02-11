'use client';

import { useState } from 'react';

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
}

const PRESET_COLORS = [
  { label: 'Transparent', value: null, style: 'checkerboard-swatch' },
  { label: 'White', value: '#ffffff', style: '' },
  { label: 'Black', value: '#000000', style: '' },
  { label: 'Red', value: '#ef4444', style: '' },
  { label: 'Blue', value: '#3b82f6', style: '' },
  { label: 'Green', value: '#22c55e', style: '' },
  { label: 'Yellow', value: '#eab308', style: '' },
  { label: 'Purple', value: '#a855f7', style: '' },
  { label: 'Pink', value: '#ec4899', style: '' },
  { label: 'Cyan', value: '#06b6d4', style: '' },
] as const;

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customHex, setCustomHex] = useState(value ?? '#ff3366');

  const isActive = (color: string | null) =>
    value === color || (value === null && color === null);

  const handleCustomChange = (hex: string) => {
    setCustomHex(hex);
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Background Color
      </h4>
      <div className="flex flex-wrap items-center gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.label}
            title={c.label}
            onClick={() => onChange(c.value)}
            className={`w-8 h-8 rounded-lg border-2 cursor-pointer transition-all duration-200 flex-shrink-0 ${
              isActive(c.value)
                ? 'border-accent shadow-[0_0_12px_var(--color-accent-glow)] scale-110'
                : 'border-border hover:border-border-light'
            } ${c.style === 'checkerboard-swatch' ? 'checkerboard-bg' : ''}`}
            style={c.value ? { backgroundColor: c.value } : undefined}
          />
        ))}
        <button
          title="Custom color"
          onClick={() => setShowCustom(!showCustom)}
          className={`w-8 h-8 rounded-lg border-2 cursor-pointer transition-all duration-200 flex-shrink-0 flex items-center justify-center text-text-muted hover:text-text ${
            showCustom
              ? 'border-accent bg-accent/10'
              : 'border-border hover:border-border-light bg-surface'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-3 mt-3">
          <input
            type="color"
            value={customHex}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent"
          />
          <input
            type="text"
            value={customHex}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="#ff3366"
            maxLength={7}
            className="w-24 px-3 py-2 text-sm font-mono bg-surface border border-border rounded-lg text-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      )}
    </div>
  );
}
