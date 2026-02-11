'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import { searchPexels, type PexelsPhoto } from '@/lib/pexels';
import { useEditorStore } from '@/store/editorStore';
import { loadImage } from '@/lib/canvasCompositor';
import { type GradientDef } from '@/lib/layers';

interface BackgroundPickerProps {
  bgColor: string | null;
  setBgColor: (color: string | null) => void;
}

type SubTab = 'color' | 'gradient' | 'image';

const GRADIENT_PRESETS: { name: string; gradient: GradientDef; css: string }[] = [
  {
    name: 'Sunset',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#ff512f' }, { offset: 1, color: '#dd2476' }] },
    css: 'linear-gradient(135deg, #ff512f, #dd2476)',
  },
  {
    name: 'Ocean',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#2193b0' }, { offset: 1, color: '#6dd5ed' }] },
    css: 'linear-gradient(135deg, #2193b0, #6dd5ed)',
  },
  {
    name: 'Aurora',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#00c6ff' }, { offset: 1, color: '#0072ff' }] },
    css: 'linear-gradient(135deg, #00c6ff, #0072ff)',
  },
  {
    name: 'Forest',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#11998e' }, { offset: 1, color: '#38ef7d' }] },
    css: 'linear-gradient(135deg, #11998e, #38ef7d)',
  },
  {
    name: 'Lavender',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#a18cd1' }, { offset: 1, color: '#fbc2eb' }] },
    css: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  },
  {
    name: 'Peach',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#ffecd2' }, { offset: 1, color: '#fcb69f' }] },
    css: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
  },
  {
    name: 'Night Sky',
    gradient: { type: 'linear', angle: 180, stops: [{ offset: 0, color: '#0f0c29' }, { offset: 0.5, color: '#302b63' }, { offset: 1, color: '#24243e' }] },
    css: 'linear-gradient(180deg, #0f0c29, #302b63, #24243e)',
  },
  {
    name: 'Fire',
    gradient: { type: 'linear', angle: 0, stops: [{ offset: 0, color: '#f12711' }, { offset: 1, color: '#f5af19' }] },
    css: 'linear-gradient(0deg, #f12711, #f5af19)',
  },
  {
    name: 'Candy',
    gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#fc5c7d' }, { offset: 1, color: '#6a82fb' }] },
    css: 'linear-gradient(90deg, #fc5c7d, #6a82fb)',
  },
  {
    name: 'Mint',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#00b09b' }, { offset: 1, color: '#96c93d' }] },
    css: 'linear-gradient(135deg, #00b09b, #96c93d)',
  },
  {
    name: 'Berry',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#8e2de2' }, { offset: 1, color: '#4a00e0' }] },
    css: 'linear-gradient(135deg, #8e2de2, #4a00e0)',
  },
  {
    name: 'Coral',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#ff9a9e' }, { offset: 1, color: '#fad0c4' }] },
    css: 'linear-gradient(135deg, #ff9a9e, #fad0c4)',
  },
  {
    name: 'Midnight',
    gradient: { type: 'radial', angle: 0, stops: [{ offset: 0, color: '#434343' }, { offset: 1, color: '#000000' }] },
    css: 'radial-gradient(circle, #434343, #000000)',
  },
  {
    name: 'Neon',
    gradient: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#ff3366' }, { offset: 0.5, color: '#00d4aa' }, { offset: 1, color: '#3b82f6' }] },
    css: 'linear-gradient(90deg, #ff3366, #00d4aa, #3b82f6)',
  },
  {
    name: 'Gold',
    gradient: { type: 'linear', angle: 135, stops: [{ offset: 0, color: '#f7971e' }, { offset: 1, color: '#ffd200' }] },
    css: 'linear-gradient(135deg, #f7971e, #ffd200)',
  },
  {
    name: 'Arctic',
    gradient: { type: 'linear', angle: 180, stops: [{ offset: 0, color: '#e6dada' }, { offset: 1, color: '#274046' }] },
    css: 'linear-gradient(180deg, #e6dada, #274046)',
  },
];

function gradientToCss(g: GradientDef): string {
  const colors = g.stops.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(', ');
  if (g.type === 'radial') return `radial-gradient(circle, ${colors})`;
  return `linear-gradient(${g.angle}deg, ${colors})`;
}

const ANGLE_PRESETS = [0, 45, 90, 135, 180, 225, 270, 315];

function GradientEditor({ gradient, onChange }: { gradient: GradientDef; onChange: (g: GradientDef) => void }) {
  const updateStop = (index: number, color: string) => {
    const newStops = gradient.stops.map((s, i) => i === index ? { ...s, color } : s);
    onChange({ ...gradient, stops: newStops });
  };

  const updateAngle = (angle: number) => {
    onChange({ ...gradient, angle });
  };

  const toggleType = () => {
    onChange({ ...gradient, type: gradient.type === 'linear' ? 'radial' : 'linear' });
  };

  const addStop = () => {
    if (gradient.stops.length >= 5) return;
    const lastTwo = gradient.stops.slice(-2);
    const midOffset = (lastTwo[0].offset + lastTwo[1].offset) / 2;
    const newStops = [...gradient.stops, { offset: midOffset, color: '#ffffff' }]
      .sort((a, b) => a.offset - b.offset);
    onChange({ ...gradient, stops: newStops });
  };

  const removeStop = (index: number) => {
    if (gradient.stops.length <= 2) return;
    onChange({ ...gradient, stops: gradient.stops.filter((_, i) => i !== index) });
  };

  return (
    <div className="p-4 bg-surface rounded-xl border border-border space-y-4">
      {/* Live preview */}
      <div
        className="h-12 rounded-lg border border-border"
        style={{ background: gradientToCss(gradient) }}
      />

      {/* Type toggle */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Type</span>
        <div className="flex bg-surface-light rounded-lg p-0.5">
          <button
            onClick={() => gradient.type !== 'linear' && toggleType()}
            className={`px-3 py-1.5 text-xs rounded-md border-none cursor-pointer transition-all duration-200 font-[inherit] ${
              gradient.type === 'linear' ? 'bg-accent text-white' : 'bg-transparent text-text-muted hover:text-text'
            }`}
          >
            Linear
          </button>
          <button
            onClick={() => gradient.type !== 'radial' && toggleType()}
            className={`px-3 py-1.5 text-xs rounded-md border-none cursor-pointer transition-all duration-200 font-[inherit] ${
              gradient.type === 'radial' ? 'bg-accent text-white' : 'bg-transparent text-text-muted hover:text-text'
            }`}
          >
            Radial
          </button>
        </div>
      </div>

      {/* Angle (only for linear) */}
      {gradient.type === 'linear' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Angle</span>
            <span className="text-xs text-text-dim font-mono">{gradient.angle}&deg;</span>
          </div>
          <div className="flex gap-1.5 mb-2">
            {ANGLE_PRESETS.map((a) => (
              <button
                key={a}
                onClick={() => updateAngle(a)}
                className={`w-8 h-8 rounded-lg border text-[10px] font-mono cursor-pointer transition-all duration-200 flex items-center justify-center font-[inherit] ${
                  gradient.angle === a
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-surface-light border-border text-text-dim hover:text-text hover:border-border-light'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={360}
            value={gradient.angle}
            onChange={(e) => updateAngle(+e.target.value)}
            className="w-full accent-accent"
          />
        </div>
      )}

      {/* Color stops */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Colors</span>
          {gradient.stops.length < 5 && (
            <button
              onClick={addStop}
              className="text-[10px] text-accent hover:text-accent/80 cursor-pointer bg-transparent border-none font-[inherit] transition-colors"
            >
              + Add Stop
            </button>
          )}
        </div>
        <div className="space-y-2">
          {gradient.stops.map((stop, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={stop.color}
                onChange={(e) => updateStop(i, e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-border bg-transparent flex-shrink-0"
              />
              <input
                type="text"
                value={stop.color}
                onChange={(e) => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value) || e.target.value === '') {
                    updateStop(i, e.target.value);
                  }
                }}
                maxLength={7}
                className="w-20 px-2 py-1.5 text-xs font-mono bg-surface-light border border-border rounded-lg text-text focus:outline-none focus:border-accent transition-colors"
              />
              <span className="text-[10px] text-text-dim flex-1">
                {Math.round(stop.offset * 100)}%
              </span>
              {gradient.stops.length > 2 && (
                <button
                  onClick={() => removeStop(i)}
                  className="p-1 text-text-dim hover:text-accent cursor-pointer bg-transparent border-none transition-colors"
                  title="Remove stop"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BackgroundPicker({ bgColor, setBgColor }: BackgroundPickerProps) {
  const [subTab, setSubTab] = useState<SubTab>('color');
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const setBackgroundImage = useEditorStore((s) => s.setBackgroundImage);
  const setBackgroundGradient = useEditorStore((s) => s.setBackgroundGradient);
  const bg = useEditorStore((s) => s.getBackground());

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPhotos([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const results = await searchPexels(q);
      setPhotos(results);
    } catch {
      setPhotos([]);
    }
    setLoading(false);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleSelectPhoto = async (photo: PexelsPhoto) => {
    try {
      const img = await loadImage(photo.src.large);
      setBackgroundImage(photo.src.large, img, `Photo by ${photo.photographer} on Pexels`);
    } catch {
      try {
        const img = await loadImage(photo.src.medium);
        setBackgroundImage(photo.src.medium, img, `Photo by ${photo.photographer} on Pexels`);
      } catch {
        // silently fail
      }
    }
  };

  const isActiveGradient = (preset: typeof GRADIENT_PRESETS[0]) => {
    if (!bg?.gradient) return false;
    return JSON.stringify(bg.gradient) === JSON.stringify(preset.gradient);
  };

  const pillBase = 'px-4 py-2 text-sm font-medium rounded-lg border cursor-pointer transition-all duration-200 font-[inherit]';
  const pillActive = 'bg-accent/10 border-accent text-accent';
  const pillInactive = 'bg-surface border-border text-text-muted hover:text-text hover:border-border-light';

  return (
    <div>
      {/* Sub-tab pills */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setSubTab('color')} className={`${pillBase} ${subTab === 'color' ? pillActive : pillInactive}`}>
          Solid
        </button>
        <button onClick={() => setSubTab('gradient')} className={`${pillBase} ${subTab === 'gradient' ? pillActive : pillInactive}`}>
          Gradient
        </button>
        <button onClick={() => setSubTab('image')} className={`${pillBase} ${subTab === 'image' ? pillActive : pillInactive}`}>
          Image
        </button>
      </div>

      {subTab === 'color' && <ColorPicker value={bgColor} onChange={setBgColor} />}

      {subTab === 'gradient' && (
        <div className="space-y-4">
          {/* Preset grid */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Presets</h4>
            <div className="grid grid-cols-4 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setBackgroundGradient(preset.gradient)}
                  title={preset.name}
                  className={`aspect-square rounded-xl border-2 cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                    isActiveGradient(preset)
                      ? 'border-accent shadow-[0_0_12px_var(--color-accent-glow)] scale-105'
                      : 'border-border/50 hover:border-border-light hover:scale-105'
                  }`}
                  style={{ background: preset.css }}
                >
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] text-white/80 py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Gradient editor — visible when a gradient is active */}
          {bg?.gradient && (
            <GradientEditor gradient={bg.gradient} onChange={setBackgroundGradient} />
          )}
        </div>
      )}

      {subTab === 'image' && (
        <div>
          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search Pexels for backgrounds..."
              className="w-full px-4 py-2.5 pl-10 text-sm bg-surface border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors font-[inherit]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>

          {loading && (
            <div className="text-center py-8 text-text-muted text-sm">Searching...</div>
          )}

          {!loading && searched && photos.length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm">No results found</div>
          )}

          {photos.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleSelectPhoto(photo)}
                    className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 group ${
                      bg?.imageUrl === photo.src.large || bg?.imageUrl === photo.src.medium
                        ? 'border-accent shadow-[0_0_12px_var(--color-accent-glow)]'
                        : 'border-transparent hover:border-border-light'
                    }`}
                  >
                    <img
                      src={photo.src.tiny}
                      alt={photo.alt || 'Pexels photo'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-text-dim mt-2">
                Photos provided by{' '}
                <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-accent-2 hover:underline">
                  Pexels
                </a>
              </p>
            </>
          )}

          {bg?.attribution && (
            <p className="text-[10px] text-text-dim mt-2">{bg.attribution}</p>
          )}
        </div>
      )}
    </div>
  );
}
