import { Layer, BackgroundLayer, SubjectLayer, StickerLayer, TextLayer, GradientDef } from './layers';

export interface FramePreset {
  name: string;
  platform: string;
  width: number;
  height: number;
}

export const FRAME_PRESETS: FramePreset[] = [
  { name: 'Instagram Post', platform: 'Instagram', width: 1080, height: 1080 },
  { name: 'Instagram Story', platform: 'Instagram', width: 1080, height: 1920 },
  { name: 'Facebook Post', platform: 'Facebook', width: 1200, height: 630 },
  { name: 'Facebook Cover', platform: 'Facebook', width: 820, height: 312 },
  { name: 'Twitter/X Post', platform: 'Twitter/X', width: 1600, height: 900 },
  { name: 'LinkedIn Post', platform: 'LinkedIn', width: 1200, height: 627 },
];

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

// --- Legacy API (kept for compatibility) ---

export interface CompositeOptions {
  subjectImage: HTMLImageElement;
  bgColor: string | null;
  frameWidth: number | null;
  frameHeight: number | null;
}

export function renderComposite(
  canvas: HTMLCanvasElement,
  { subjectImage, bgColor, frameWidth, frameHeight }: CompositeOptions
) {
  const w = frameWidth ?? subjectImage.naturalWidth;
  const h = frameHeight ?? subjectImage.naturalHeight;

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
  }

  const scale = Math.min(w / subjectImage.naturalWidth, h / subjectImage.naturalHeight);
  const sw = subjectImage.naturalWidth * scale;
  const sh = subjectImage.naturalHeight * scale;
  const sx = (w - sw) / 2;
  const sy = (h - sh) / 2;

  ctx.drawImage(subjectImage, sx, sy, sw, sh);
}

// --- New Layer-based rendering ---

export interface RenderLayersOptions {
  layers: Layer[];
  width: number;
  height: number;
  selectedLayerId?: string | null;
  showHandles?: boolean;
}

function createCanvasGradient(
  ctx: CanvasRenderingContext2D,
  grad: GradientDef,
  w: number,
  h: number
): CanvasGradient {
  if (grad.type === 'radial') {
    const cg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
    for (const stop of grad.stops) cg.addColorStop(stop.offset, stop.color);
    return cg;
  }
  // Linear gradient with angle
  const angle = (grad.angle * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  const len = Math.max(w, h);
  const x0 = cx - Math.cos(angle) * len / 2;
  const y0 = cy - Math.sin(angle) * len / 2;
  const x1 = cx + Math.cos(angle) * len / 2;
  const y1 = cy + Math.sin(angle) * len / 2;
  const cg = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const stop of grad.stops) cg.addColorStop(stop.offset, stop.color);
  return cg;
}

function drawBackground(ctx: CanvasRenderingContext2D, layer: BackgroundLayer, w: number, h: number) {
  if (layer.imageElement) {
    // Cover-fit the background image
    const img = layer.imageElement;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = w / h;

    let sw: number, sh: number, sx: number, sy: number;
    if (imgRatio > canvasRatio) {
      sh = img.naturalHeight;
      sw = sh * canvasRatio;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  } else if (layer.gradient) {
    ctx.fillStyle = createCanvasGradient(ctx, layer.gradient, w, h);
    ctx.fillRect(0, 0, w, h);
  } else if (layer.color) {
    ctx.fillStyle = layer.color;
    ctx.fillRect(0, 0, w, h);
  }
}

// Cache for composited mask result to avoid re-compositing every frame
let _cachedMaskVersion = -1;
let _cachedCompositedCanvas: HTMLCanvasElement | null = null;

function drawSubject(ctx: CanvasRenderingContext2D, layer: SubjectLayer, canvasW: number, canvasH: number) {
  if (!layer.imageElement) return;
  const img = layer.imageElement;

  ctx.save();
  ctx.globalAlpha = layer.opacity;

  const scale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  const baseX = (canvasW - sw) / 2;
  const baseY = (canvasH - sh) / 2;

  if (layer.maskCanvas) {
    // Check cache — only re-composite when mask changes
    if (_cachedMaskVersion !== layer._maskVersion || !_cachedCompositedCanvas) {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d')!;

      // Use original image as source (enables restore brush),
      // fall back to bg-removed image if original not loaded yet
      const sourceImg = layer.originalImageElement ?? img;
      tempCtx.drawImage(sourceImg, 0, 0, w, h);

      // Apply mask: destination-in keeps only pixels where mask is white
      tempCtx.globalCompositeOperation = 'destination-in';
      tempCtx.drawImage(layer.maskCanvas, 0, 0);
      tempCtx.globalCompositeOperation = 'source-over';

      _cachedCompositedCanvas = tempCanvas;
      _cachedMaskVersion = layer._maskVersion;
    }

    ctx.drawImage(_cachedCompositedCanvas!, baseX + layer.x, baseY + layer.y, sw, sh);
  } else {
    ctx.drawImage(img, baseX + layer.x, baseY + layer.y, sw, sh);
  }

  ctx.restore();
}

function drawSticker(ctx: CanvasRenderingContext2D, layer: StickerLayer) {
  ctx.save();
  ctx.globalAlpha = layer.opacity;

  if (layer.isEmoji) {
    const fontSize = Math.min(layer.width, layer.height);
    ctx.font = `${fontSize}px serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(layer.src, layer.x, layer.y);
  } else if (layer.imageElement) {
    ctx.drawImage(layer.imageElement, layer.x, layer.y, layer.width, layer.height);
  }

  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, layer: TextLayer) {
  if (!layer.content) return;

  ctx.save();
  ctx.globalAlpha = layer.opacity;

  const style = `${layer.fontStyle === 'italic' ? 'italic ' : ''}${layer.fontWeight === 'bold' ? 'bold ' : ''}`;
  ctx.font = `${style}${layer.fontSize}px "${layer.fontFamily}"`;
  ctx.textBaseline = 'top';

  if (layer.shadow) {
    ctx.shadowColor = layer.shadowColor;
    ctx.shadowBlur = layer.shadowBlur;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  if (layer.outline) {
    ctx.strokeStyle = layer.outlineColor;
    ctx.lineWidth = layer.outlineWidth;
    ctx.lineJoin = 'round';
    ctx.strokeText(layer.content, layer.x, layer.y);

    // Reset shadow before fill to avoid double shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  ctx.fillStyle = layer.color;
  ctx.fillText(layer.content, layer.x, layer.y);

  ctx.restore();
}

export function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  canvasW: number,
  canvasH: number
) {
  let x: number, y: number, w: number, h: number;

  if (layer.type === 'subject' && layer.imageElement) {
    const img = layer.imageElement;
    const scale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
    w = img.naturalWidth * scale;
    h = img.naturalHeight * scale;
    x = (canvasW - w) / 2 + layer.x;
    y = (canvasH - h) / 2 + layer.y;
  } else if (layer.type === 'text') {
    // Measure text to get bounds
    const textLayer = layer as TextLayer;
    const offscreen = document.createElement('canvas').getContext('2d')!;
    const style = `${textLayer.fontStyle === 'italic' ? 'italic ' : ''}${textLayer.fontWeight === 'bold' ? 'bold ' : ''}`;
    offscreen.font = `${style}${textLayer.fontSize}px "${textLayer.fontFamily}"`;
    const metrics = offscreen.measureText(textLayer.content);
    x = layer.x;
    y = layer.y;
    w = metrics.width;
    h = textLayer.fontSize * 1.2;
  } else {
    x = layer.x;
    y = layer.y;
    w = layer.width;
    h = layer.height;
  }

  ctx.save();
  ctx.strokeStyle = '#00d4aa';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  ctx.setLineDash([]);

  // Corner handles
  const handleSize = 8;
  ctx.fillStyle = '#00d4aa';
  const corners = [
    [x - 2, y - 2],
    [x + w + 2 - handleSize, y - 2],
    [x - 2, y + h + 2 - handleSize],
    [x + w + 2 - handleSize, y + h + 2 - handleSize],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillRect(cx, cy, handleSize, handleSize);
  }

  ctx.restore();
}

export function renderLayers(
  canvas: HTMLCanvasElement,
  { layers, width, height, selectedLayerId, showHandles = true }: RenderLayersOptions
) {
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);

  for (const layer of layers) {
    if (!layer.visible) continue;

    switch (layer.type) {
      case 'background':
        drawBackground(ctx, layer, width, height);
        break;
      case 'subject':
        drawSubject(ctx, layer, width, height);
        break;
      case 'sticker':
        drawSticker(ctx, layer);
        break;
      case 'text':
        drawText(ctx, layer);
        break;
    }
  }

  // Draw selection handles on top
  if (showHandles && selectedLayerId) {
    const selected = layers.find((l) => l.id === selectedLayerId);
    if (selected && selected.type !== 'background') {
      drawSelectionHandles(ctx, selected, width, height);
    }
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    );
  });
}

/** Measure a text layer's bounding box */
export function measureTextLayer(layer: TextLayer): { width: number; height: number } {
  const offscreen = document.createElement('canvas').getContext('2d')!;
  const style = `${layer.fontStyle === 'italic' ? 'italic ' : ''}${layer.fontWeight === 'bold' ? 'bold ' : ''}`;
  offscreen.font = `${style}${layer.fontSize}px "${layer.fontFamily}"`;
  const metrics = offscreen.measureText(layer.content || ' ');
  return {
    width: metrics.width,
    height: layer.fontSize * 1.2,
  };
}
