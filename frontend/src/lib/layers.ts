// Layer type definitions for the canvas editor

export interface BaseLayer {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
}

export interface GradientDef {
  type: 'linear' | 'radial';
  angle: number; // degrees, for linear
  stops: { offset: number; color: string }[];
}

export interface BackgroundLayer extends BaseLayer {
  type: 'background';
  color: string | null;
  gradient: GradientDef | null;
  imageUrl: string | null;
  imageElement: HTMLImageElement | null;
  attribution: string | null;
}

export interface SubjectLayer extends BaseLayer {
  type: 'subject';
  imageElement: HTMLImageElement | null;
  maskCanvas: HTMLCanvasElement | null;
  originalImageElement: HTMLImageElement | null;
  _maskVersion: number;
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker';
  src: string; // emoji character or SVG URL
  isEmoji: boolean;
  imageElement: HTMLImageElement | null; // loaded SVG image
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;
}

export type Layer = BackgroundLayer | SubjectLayer | StickerLayer | TextLayer;

let _nextId = 1;
export function generateLayerId(): string {
  return `layer-${_nextId++}-${Date.now()}`;
}

export function createBackgroundLayer(): BackgroundLayer {
  return {
    id: generateLayerId(),
    type: 'background',
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    color: null,
    gradient: null,
    imageUrl: null,
    imageElement: null,
    attribution: null,
  };
}

export function createSubjectLayer(img: HTMLImageElement | null): SubjectLayer {
  return {
    id: generateLayerId(),
    type: 'subject',
    x: 0,
    y: 0,
    width: img?.naturalWidth ?? 0,
    height: img?.naturalHeight ?? 0,
    rotation: 0,
    opacity: 1,
    visible: true,
    imageElement: img,
    maskCanvas: null,
    originalImageElement: null,
    _maskVersion: 0,
  };
}

export function createStickerLayer(src: string, isEmoji: boolean): StickerLayer {
  return {
    id: generateLayerId(),
    type: 'sticker',
    src,
    isEmoji,
    imageElement: null,
    x: 0,
    y: 0,
    width: 80,
    height: 80,
    rotation: 0,
    opacity: 1,
    visible: true,
  };
}

export function createTextLayer(): TextLayer {
  return {
    id: generateLayerId(),
    type: 'text',
    content: 'Your Text',
    fontFamily: 'Space Grotesk',
    fontSize: 48,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#ffffff',
    shadow: false,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowBlur: 4,
    outline: false,
    outlineColor: '#000000',
    outlineWidth: 2,
    x: 0,
    y: 0,
    width: 200,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
  };
}
