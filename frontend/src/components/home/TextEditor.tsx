'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { TextLayer } from '@/lib/layers';
import { FONT_OPTIONS, loadGoogleFont } from '@/lib/fonts';

const TEXT_COLORS = [
  '#ffffff', '#000000', '#ff3366', '#00d4aa',
  '#3b82f6', '#eab308', '#a855f7', '#ef4444',
];

export default function TextEditor() {
  const addText = useEditorStore((s) => s.addText);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const layers = useEditorStore((s) => s.layers);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const selectedLayer = selectedLayerId
    ? layers.find((l) => l.id === selectedLayerId && l.type === 'text')
    : null;
  const textLayer = selectedLayer as TextLayer | null;

  // Load font when selected layer changes font
  const fontFamily = textLayer?.fontFamily;
  useEffect(() => {
    if (!fontFamily) return;
    const font = FONT_OPTIONS.find((f) => f.family === fontFamily);
    if (font) {
      loadGoogleFont(font);
    }
  }, [fontFamily]);

  const handleUpdate = (updates: Partial<TextLayer>) => {
    if (!textLayer) return;
    updateLayer(textLayer.id, updates);
  };

  const handleFontChange = async (family: string) => {
    const font = FONT_OPTIONS.find((f) => f.family === family);
    if (font) {
      await loadGoogleFont(font);
    }
    handleUpdate({ fontFamily: family });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={addText}
        className="w-full px-4 py-3 text-sm font-semibold rounded-lg border border-border bg-surface text-text hover:bg-surface-hover hover:border-border-light cursor-pointer transition-all duration-200 font-[inherit] flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4v16m8-8H4" />
        </svg>
        Add Text
      </button>

      {textLayer && (
        <div className="space-y-4 p-4 bg-surface rounded-xl border border-border">
          {/* Text content */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Content</label>
            <textarea
              value={textLayer.content}
              onChange={(e) => handleUpdate({ content: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-lg text-text focus:outline-none focus:border-accent transition-colors resize-none font-[inherit]"
            />
          </div>

          {/* Font family */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Font</label>
            <select
              value={textLayer.fontFamily}
              onChange={(e) => handleFontChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface-light border border-border rounded-lg text-text focus:outline-none focus:border-accent transition-colors cursor-pointer font-[inherit]"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.family} value={font.family}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
              Size: {textLayer.fontSize}px
            </label>
            <input
              type="range"
              min={12}
              max={200}
              value={textLayer.fontSize}
              onChange={(e) => handleUpdate({ fontSize: +e.target.value })}
              className="w-full accent-accent"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleUpdate({ color: c })}
                  className={`w-7 h-7 rounded-md border-2 cursor-pointer transition-all duration-200 ${
                    textLayer.color === c
                      ? 'border-accent scale-110'
                      : 'border-border hover:border-border-light'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Style toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdate({ fontWeight: textLayer.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`px-3 py-2 text-sm font-bold rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] ${
                textLayer.fontWeight === 'bold'
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-surface-light border-border text-text-muted hover:text-text'
              }`}
            >
              B
            </button>
            <button
              onClick={() => handleUpdate({ fontStyle: textLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={`px-3 py-2 text-sm italic rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] ${
                textLayer.fontStyle === 'italic'
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-surface-light border-border text-text-muted hover:text-text'
              }`}
            >
              I
            </button>
            <button
              onClick={() => handleUpdate({ shadow: !textLayer.shadow })}
              className={`px-3 py-2 text-sm rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] ${
                textLayer.shadow
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-surface-light border-border text-text-muted hover:text-text'
              }`}
            >
              Shadow
            </button>
            <button
              onClick={() => handleUpdate({ outline: !textLayer.outline })}
              className={`px-3 py-2 text-sm rounded-lg border cursor-pointer transition-all duration-200 font-[inherit] ${
                textLayer.outline
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-surface-light border-border text-text-muted hover:text-text'
              }`}
            >
              Outline
            </button>
          </div>
        </div>
      )}

      {!textLayer && selectedLayerId && (
        <p className="text-xs text-text-dim text-center">Select a text layer to edit its properties</p>
      )}
    </div>
  );
}
