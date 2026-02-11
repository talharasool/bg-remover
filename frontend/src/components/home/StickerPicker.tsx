'use client';

import { useState } from 'react';
import { EMOJI_STICKERS, SVG_STICKERS, STICKER_CATEGORIES } from '@/lib/stickers';
import { useEditorStore } from '@/store/editorStore';
import { loadImage } from '@/lib/canvasCompositor';

type SubTab = 'emoji' | 'svg';

export default function StickerPicker() {
  const [subTab, setSubTab] = useState<SubTab>('emoji');
  const [activeCategory, setActiveCategory] = useState<string>('Shapes');
  const addSticker = useEditorStore((s) => s.addSticker);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const handleAddEmoji = (emoji: string) => {
    addSticker(emoji, true);
  };

  const handleAddSvg = async (src: string) => {
    const layerId = addSticker(src, false);
    try {
      const img = await loadImage(src);
      updateLayer(layerId, { imageElement: img });
    } catch {
      // silently fail
    }
  };

  const filteredStickers = SVG_STICKERS.filter((s) => s.category === activeCategory);

  const pillBase = 'px-4 py-2 text-sm font-medium rounded-lg border cursor-pointer transition-all duration-200 font-[inherit]';
  const pillActive = 'bg-accent/10 border-accent text-accent';
  const pillInactive = 'bg-surface border-border text-text-muted hover:text-text hover:border-border-light';

  return (
    <div>
      {/* Sub-tab pills */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setSubTab('emoji')} className={`${pillBase} ${subTab === 'emoji' ? pillActive : pillInactive}`}>
          Emoji
        </button>
        <button onClick={() => setSubTab('svg')} className={`${pillBase} ${subTab === 'svg' ? pillActive : pillInactive}`}>
          Stickers
        </button>
      </div>

      {subTab === 'emoji' && (
        <div className="grid grid-cols-6 gap-2">
          {EMOJI_STICKERS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => handleAddEmoji(emoji)}
              className="w-full aspect-square flex items-center justify-center text-2xl rounded-xl bg-surface border border-border hover:bg-surface-hover hover:border-accent/40 hover:scale-110 cursor-pointer transition-all duration-200"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {subTab === 'svg' && (
        <div>
          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {STICKER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border cursor-pointer transition-all duration-200 font-[inherit] ${
                  activeCategory === cat
                    ? 'bg-accent-2/10 border-accent-2 text-accent-2'
                    : 'bg-surface border-border text-text-muted hover:text-text hover:border-border-light'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SVG grid — dark bg to show white SVGs */}
          <div className="grid grid-cols-5 gap-2.5">
            {filteredStickers.map((sticker) => (
              <button
                key={sticker.src}
                onClick={() => handleAddSvg(sticker.src)}
                title={sticker.name}
                className="w-full aspect-square flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-surface-light border border-border hover:bg-accent/10 hover:border-accent/40 hover:scale-110 cursor-pointer transition-all duration-200 group"
              >
                <img
                  src={sticker.src}
                  alt={sticker.name}
                  className="w-9 h-9 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <span className="text-[9px] text-text-dim group-hover:text-text-muted truncate w-full text-center transition-colors">
                  {sticker.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
