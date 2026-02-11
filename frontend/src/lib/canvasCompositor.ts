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

  // Contain-fit subject centered
  const scale = Math.min(w / subjectImage.naturalWidth, h / subjectImage.naturalHeight);
  const sw = subjectImage.naturalWidth * scale;
  const sh = subjectImage.naturalHeight * scale;
  const sx = (w - sw) / 2;
  const sy = (h - sh) / 2;

  ctx.drawImage(subjectImage, sx, sy, sw, sh);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    );
  });
}
