import { create } from 'zustand';
import {
  Layer,
  BackgroundLayer,
  SubjectLayer,
  StickerLayer,
  TextLayer,
  GradientDef,
  createBackgroundLayer,
  createSubjectLayer,
  createStickerLayer,
  createTextLayer,
} from '@/lib/layers';
import { type FramePreset } from '@/lib/canvasCompositor';

interface EditorState {
  layers: Layer[];
  selectedLayerId: string | null;
  framePreset: FramePreset | null;
  isCustomFrame: boolean;
  customWidth: number;
  customHeight: number;
  canvasWidth: number;
  canvasHeight: number;

  // Initialization
  initLayers: (subjectImage: HTMLImageElement) => void;

  // Layer CRUD
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  reorderLayer: (id: string, direction: 'up' | 'down') => void;
  setSelectedLayerId: (id: string | null) => void;

  // Background
  setBackgroundColor: (color: string | null) => void;
  setBackgroundGradient: (gradient: GradientDef | null) => void;
  setBackgroundImage: (url: string | null, element: HTMLImageElement | null, attribution: string | null) => void;

  // Frame
  setFramePreset: (preset: FramePreset | null) => void;
  setCustomFrame: () => void;
  setCustomSize: (w: number, h: number) => void;

  // Convenience
  addSticker: (src: string, isEmoji: boolean) => string;
  addText: () => string;
  getLayer: (id: string) => Layer | undefined;
  getBackground: () => BackgroundLayer | undefined;
  getSubject: () => SubjectLayer | undefined;

  // Reset
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  layers: [],
  selectedLayerId: null,
  framePreset: null,
  isCustomFrame: false,
  customWidth: 1080,
  customHeight: 1080,
  canvasWidth: 0,
  canvasHeight: 0,

  initLayers: (subjectImage: HTMLImageElement) => {
    const bg = createBackgroundLayer();
    const subject = createSubjectLayer(subjectImage);

    // Position subject centered with contain-fit (will be recalculated on render)
    const w = subjectImage.naturalWidth;
    const h = subjectImage.naturalHeight;
    subject.x = 0;
    subject.y = 0;
    subject.width = w;
    subject.height = h;

    set({
      layers: [bg, subject],
      selectedLayerId: null,
      canvasWidth: w,
      canvasHeight: h,
    });
  },

  addLayer: (layer: Layer) => {
    set((state) => ({
      layers: [...state.layers, layer],
      selectedLayerId: layer.id,
    }));
  },

  updateLayer: (id: string, updates: Partial<Layer>) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } as Layer : l
      ),
    }));
  },

  removeLayer: (id: string) => {
    set((state) => {
      const layer = state.layers.find((l) => l.id === id);
      // Don't allow removing background or subject
      if (layer?.type === 'background' || layer?.type === 'subject') return state;
      return {
        layers: state.layers.filter((l) => l.id !== id),
        selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
      };
    });
  },

  reorderLayer: (id: string, direction: 'up' | 'down') => {
    set((state) => {
      const idx = state.layers.findIndex((l) => l.id === id);
      const layer = state.layers[idx];
      // Don't reorder background (idx 0) or subject (idx 1)
      if (!layer || layer.type === 'background' || layer.type === 'subject') return state;

      const newIdx = direction === 'up' ? idx + 1 : idx - 1;
      // Don't move below subject layer (index 1)
      if (newIdx < 2 || newIdx >= state.layers.length) return state;

      const newLayers = [...state.layers];
      newLayers.splice(idx, 1);
      newLayers.splice(newIdx, 0, layer);
      return { layers: newLayers };
    });
  },

  setSelectedLayerId: (id: string | null) => {
    set({ selectedLayerId: id });
  },

  setBackgroundColor: (color: string | null) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.type === 'background'
          ? { ...l, color, gradient: null, imageUrl: null, imageElement: null, attribution: null } as BackgroundLayer
          : l
      ),
    }));
  },

  setBackgroundGradient: (gradient: GradientDef | null) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.type === 'background'
          ? { ...l, color: null, gradient, imageUrl: null, imageElement: null, attribution: null } as BackgroundLayer
          : l
      ),
    }));
  },

  setBackgroundImage: (url, element, attribution) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.type === 'background'
          ? { ...l, color: null, gradient: null, imageUrl: url, imageElement: element, attribution } as BackgroundLayer
          : l
      ),
    }));
  },

  setFramePreset: (preset: FramePreset | null) => {
    set({ framePreset: preset, isCustomFrame: false });
  },

  setCustomFrame: () => {
    set({ framePreset: null, isCustomFrame: true });
  },

  setCustomSize: (w: number, h: number) => {
    set({ customWidth: w, customHeight: h });
  },

  addSticker: (src: string, isEmoji: boolean) => {
    const sticker = createStickerLayer(src, isEmoji);
    const { canvasWidth, canvasHeight } = get();
    // Center the sticker on canvas
    sticker.x = (canvasWidth - sticker.width) / 2;
    sticker.y = (canvasHeight - sticker.height) / 2;

    set((state) => ({
      layers: [...state.layers, sticker],
      selectedLayerId: sticker.id,
    }));
    return sticker.id;
  },

  addText: () => {
    const text = createTextLayer();
    const { canvasWidth, canvasHeight } = get();
    text.x = (canvasWidth - text.width) / 2;
    text.y = (canvasHeight - text.height) / 2;

    set((state) => ({
      layers: [...state.layers, text],
      selectedLayerId: text.id,
    }));
    return text.id;
  },

  getLayer: (id: string) => get().layers.find((l) => l.id === id),
  getBackground: () => get().layers.find((l) => l.type === 'background') as BackgroundLayer | undefined,
  getSubject: () => get().layers.find((l) => l.type === 'subject') as SubjectLayer | undefined,

  reset: () => {
    set({
      layers: [],
      selectedLayerId: null,
      framePreset: null,
      isCustomFrame: false,
      customWidth: 1080,
      customHeight: 1080,
      canvasWidth: 0,
      canvasHeight: 0,
    });
  },
}));
