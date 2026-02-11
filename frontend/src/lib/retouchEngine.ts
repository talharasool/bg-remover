// Retouch engine: mask operations, brush painting, magic eraser, undo stack
//
// Mask format: RGBA canvas where the ALPHA channel encodes visibility.
// White opaque (255,255,255,255) = visible, fully transparent (x,x,x,0) = erased.
// The compositor uses globalCompositeOperation='destination-in' which reads
// the source alpha to modulate the destination.

// --- Coordinate transforms ---

export interface SubjectTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function getSubjectTransform(
  imgW: number,
  imgH: number,
  canvasW: number,
  canvasH: number,
  layerX: number,
  layerY: number
): SubjectTransform {
  const scale = Math.min(canvasW / imgW, canvasH / imgH);
  const offsetX = (canvasW - imgW * scale) / 2 + layerX;
  const offsetY = (canvasH - imgH * scale) / 2 + layerY;
  return { scale, offsetX, offsetY };
}

export function displayToImageCoords(
  displayX: number,
  displayY: number,
  transform: SubjectTransform
): { x: number; y: number } {
  return {
    x: (displayX - transform.offsetX) / transform.scale,
    y: (displayY - transform.offsetY) / transform.scale,
  };
}

// --- Mask initialization ---

export function initMaskFromAlpha(bgRemovedImage: HTMLImageElement): HTMLCanvasElement {
  const w = bgRemovedImage.naturalWidth;
  const h = bgRemovedImage.naturalHeight;

  // Read the bg-removed image pixels
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(bgRemovedImage, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, w, h);

  // Create mask canvas — alpha channel encodes visibility
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskData = maskCtx.createImageData(w, h);

  for (let i = 0; i < srcData.data.length; i += 4) {
    const alpha = srcData.data[i + 3];
    maskData.data[i] = 255;       // R
    maskData.data[i + 1] = 255;   // G
    maskData.data[i + 2] = 255;   // B
    maskData.data[i + 3] = alpha;  // A = source alpha (visibility)
  }

  maskCtx.putImageData(maskData, 0, 0);
  return maskCanvas;
}

// --- Brush painting ---

export function paintBrushStroke(
  maskCanvas: HTMLCanvasElement,
  imgX: number,
  imgY: number,
  radius: number,
  mode: 'erase' | 'restore',
  hardness: 'soft' | 'hard'
) {
  const ctx = maskCanvas.getContext('2d')!;

  ctx.save();

  if (mode === 'erase') {
    // Erase: remove alpha using destination-out
    ctx.globalCompositeOperation = 'destination-out';

    if (hardness === 'hard') {
      ctx.beginPath();
      ctx.arc(imgX, imgY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.fill();
    } else {
      const gradient = ctx.createRadialGradient(imgX, imgY, 0, imgX, imgY, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.6, 'rgba(255,255,255,1)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(imgX, imgY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  } else {
    // Restore: add alpha back using source-over with white + alpha
    ctx.globalCompositeOperation = 'source-over';

    if (hardness === 'hard') {
      ctx.beginPath();
      ctx.arc(imgX, imgY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,1)';
      ctx.fill();
    } else {
      const gradient = ctx.createRadialGradient(imgX, imgY, 0, imgX, imgY, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.6, 'rgba(255,255,255,1)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(imgX, imgY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  ctx.restore();
}

export function paintBrushLine(
  maskCanvas: HTMLCanvasElement,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  mode: 'erase' | 'restore',
  hardness: 'soft' | 'hard'
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const step = Math.max(1, radius * 0.3);
  const steps = Math.ceil(dist / step);

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = x0 + dx * t;
    const y = y0 + dy * t;
    paintBrushStroke(maskCanvas, x, y, radius, mode, hardness);
  }
}

// --- Magic eraser (BFS flood fill) ---

export function magicErase(
  maskCanvas: HTMLCanvasElement,
  subjectImage: HTMLImageElement,
  imgX: number,
  imgY: number,
  tolerance: number
) {
  const w = subjectImage.naturalWidth;
  const h = subjectImage.naturalHeight;

  // Clamp coords
  const startX = Math.round(imgX);
  const startY = Math.round(imgY);
  if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;

  // Read subject image pixels for color comparison
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = w;
  srcCanvas.height = h;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(subjectImage, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, w, h);

  // Read mask to check already-erased pixels (alpha channel)
  const maskCtx = maskCanvas.getContext('2d')!;
  const maskData = maskCtx.getImageData(0, 0, w, h);

  // Get target color
  const idx = (startY * w + startX) * 4;
  const targetR = srcData.data[idx];
  const targetG = srcData.data[idx + 1];
  const targetB = srcData.data[idx + 2];

  // BFS
  const visited = new Uint8Array(w * h);
  const queue: number[] = [startX, startY];
  visited[startY * w + startX] = 1;

  const tolSq = tolerance * tolerance * 3; // scaled for RGB distance

  while (queue.length > 0) {
    const cy = queue.pop()!;
    const cx = queue.pop()!;

    const pi = (cy * w + cx) * 4;

    // Skip already-erased pixels (alpha near 0)
    if (maskData.data[pi + 3] < 10) continue;

    // Color distance check
    const dr = srcData.data[pi] - targetR;
    const dg = srcData.data[pi + 1] - targetG;
    const db = srcData.data[pi + 2] - targetB;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq > tolSq) continue;

    // Erase this pixel on mask (set alpha to 0)
    maskData.data[pi + 3] = 0;

    // Expand to 4 neighbors
    const neighbors = [
      [cx - 1, cy],
      [cx + 1, cy],
      [cx, cy - 1],
      [cx, cy + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      if (visited[ny * w + nx]) continue;
      visited[ny * w + nx] = 1;
      queue.push(nx, ny);
    }
  }

  maskCtx.putImageData(maskData, 0, 0);
}

// --- Undo stack ---

const MAX_SNAPSHOTS = 15;

export interface UndoStack {
  snapshots: ImageData[];
  index: number; // points to current state
}

export function createUndoStack(): UndoStack {
  return { snapshots: [], index: -1 };
}

export function pushSnapshot(stack: UndoStack, maskCanvas: HTMLCanvasElement): UndoStack {
  const ctx = maskCanvas.getContext('2d')!;
  const data = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

  // Discard any redo history beyond current index
  const snapshots = stack.snapshots.slice(0, stack.index + 1);
  snapshots.push(data);

  // Enforce max limit
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.shift();
  }

  return { snapshots, index: snapshots.length - 1 };
}

export function undo(stack: UndoStack, maskCanvas: HTMLCanvasElement): UndoStack | null {
  if (stack.index <= 0) return null;

  const newIndex = stack.index - 1;
  const data = stack.snapshots[newIndex];
  const ctx = maskCanvas.getContext('2d')!;
  ctx.putImageData(data, 0, 0);

  return { ...stack, index: newIndex };
}

export function redo(stack: UndoStack, maskCanvas: HTMLCanvasElement): UndoStack | null {
  if (stack.index >= stack.snapshots.length - 1) return null;

  const newIndex = stack.index + 1;
  const data = stack.snapshots[newIndex];
  const ctx = maskCanvas.getContext('2d')!;
  ctx.putImageData(data, 0, 0);

  return { ...stack, index: newIndex };
}
