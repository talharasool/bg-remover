'use client';

import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';

const LAYER_TYPE_LABELS: Record<string, string> = {
  background: 'Background',
  subject: 'Subject',
  sticker: 'Sticker',
  text: 'Text',
};

export default function LayerList() {
  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const setSelectedLayerId = useEditorStore((s) => s.setSelectedLayerId);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const reorderLayer = useEditorStore((s) => s.reorderLayer);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedLayerId: id } = useEditorStore.getState();
        if (id) {
          const layer = useEditorStore.getState().layers.find((l) => l.id === id);
          if (layer && layer.type !== 'background' && layer.type !== 'subject') {
            removeLayer(id);
          }
        }
      }
      if (e.key === 'Escape') {
        setSelectedLayerId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeLayer, setSelectedLayerId]);

  // Display layers in reverse order (top layer first)
  const displayLayers = [...layers].reverse();

  return (
    <div>
      <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
        Layers
      </h4>
      <div className="space-y-1">
        {displayLayers.map((layer) => {
          const isSelected = selectedLayerId === layer.id;
          const isDeletable = layer.type !== 'background' && layer.type !== 'subject';
          const isReorderable = isDeletable;

          let label = LAYER_TYPE_LABELS[layer.type] || layer.type;
          if (layer.type === 'sticker') {
            label = layer.isEmoji ? `Emoji ${layer.src}` : `Sticker`;
          } else if (layer.type === 'text') {
            const preview = layer.content.length > 15 ? layer.content.slice(0, 15) + '...' : layer.content;
            label = `Text: ${preview}`;
          }

          return (
            <div
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-accent/10 border border-accent/30'
                  : 'bg-surface border border-transparent hover:bg-surface-hover hover:border-border'
              }`}
            >
              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateLayer(layer.id, { visible: !layer.visible });
                }}
                className="p-1 text-text-muted hover:text-text cursor-pointer bg-transparent border-none transition-colors"
                title={layer.visible ? 'Hide' : 'Show'}
              >
                {layer.visible ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>

              {/* Layer name */}
              <span className={`flex-1 text-sm truncate ${isSelected ? 'text-text' : 'text-text-muted'}`}>
                {label}
              </span>

              {/* Reorder buttons */}
              {isReorderable && (
                <div className="flex gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderLayer(layer.id, 'up');
                    }}
                    className="p-0.5 text-text-dim hover:text-text cursor-pointer bg-transparent border-none transition-colors"
                    title="Move up"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderLayer(layer.id, 'down');
                    }}
                    className="p-0.5 text-text-dim hover:text-text cursor-pointer bg-transparent border-none transition-colors"
                    title="Move down"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Delete button */}
              {isDeletable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(layer.id);
                  }}
                  className="p-1 text-text-dim hover:text-accent cursor-pointer bg-transparent border-none transition-colors"
                  title="Delete layer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-text-dim mt-3">
        Tip: Press Delete to remove selected layer, Escape to deselect
      </p>
    </div>
  );
}
