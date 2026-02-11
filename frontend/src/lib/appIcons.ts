export interface IconSpec {
  size: number;
  label: string;
  filename: string;
}

export interface PlatformIconSet {
  id: string;
  name: string;
  description: string;
  icons: IconSpec[];
}

export const APP_ICON_PLATFORMS: PlatformIconSet[] = [
  {
    id: 'ios',
    name: 'iOS / iPadOS',
    description: 'iPhone, iPad, App Store',
    icons: [
      { size: 1024, label: 'App Store', filename: 'AppIcon-1024.png' },
      { size: 180, label: 'iPhone @3x', filename: 'AppIcon-60@3x.png' },
      { size: 120, label: 'iPhone @2x', filename: 'AppIcon-60@2x.png' },
      { size: 167, label: 'iPad Pro @2x', filename: 'AppIcon-83.5@2x.png' },
      { size: 152, label: 'iPad @2x', filename: 'AppIcon-76@2x.png' },
      { size: 76, label: 'iPad @1x', filename: 'AppIcon-76.png' },
      { size: 120, label: 'Spotlight @3x', filename: 'AppIcon-40@3x.png' },
      { size: 80, label: 'Spotlight @2x', filename: 'AppIcon-40@2x.png' },
      { size: 40, label: 'Spotlight @1x', filename: 'AppIcon-40.png' },
      { size: 87, label: 'Settings @3x', filename: 'AppIcon-29@3x.png' },
      { size: 58, label: 'Settings @2x', filename: 'AppIcon-29@2x.png' },
      { size: 29, label: 'Settings @1x', filename: 'AppIcon-29.png' },
      { size: 60, label: 'Notification @3x', filename: 'AppIcon-20@3x.png' },
      { size: 40, label: 'Notification @2x', filename: 'AppIcon-20@2x.png' },
      { size: 20, label: 'Notification @1x', filename: 'AppIcon-20.png' },
    ],
  },
  {
    id: 'android',
    name: 'Android',
    description: 'Google Play, Adaptive Icons',
    icons: [
      { size: 512, label: 'Play Store', filename: 'play-store-512.png' },
      { size: 432, label: 'Adaptive xxxhdpi', filename: 'mipmap-xxxhdpi/ic_launcher.png' },
      { size: 324, label: 'Adaptive xxhdpi', filename: 'mipmap-xxhdpi/ic_launcher.png' },
      { size: 216, label: 'Adaptive xhdpi', filename: 'mipmap-xhdpi/ic_launcher.png' },
      { size: 162, label: 'Adaptive hdpi', filename: 'mipmap-hdpi/ic_launcher.png' },
      { size: 108, label: 'Adaptive mdpi', filename: 'mipmap-mdpi/ic_launcher.png' },
      { size: 192, label: 'Legacy xxxhdpi', filename: 'mipmap-xxxhdpi/ic_launcher_legacy.png' },
      { size: 144, label: 'Legacy xxhdpi', filename: 'mipmap-xxhdpi/ic_launcher_legacy.png' },
      { size: 96, label: 'Legacy xhdpi', filename: 'mipmap-xhdpi/ic_launcher_legacy.png' },
      { size: 72, label: 'Legacy hdpi', filename: 'mipmap-hdpi/ic_launcher_legacy.png' },
      { size: 48, label: 'Legacy mdpi', filename: 'mipmap-mdpi/ic_launcher_legacy.png' },
    ],
  },
  {
    id: 'macos',
    name: 'macOS',
    description: 'Mac App Store, Dock',
    icons: [
      { size: 1024, label: '512pt @2x', filename: 'icon_512x512@2x.png' },
      { size: 512, label: '512pt @1x', filename: 'icon_512x512.png' },
      { size: 256, label: '128pt @2x', filename: 'icon_128x128@2x.png' },
      { size: 128, label: '128pt @1x', filename: 'icon_128x128.png' },
      { size: 64, label: '32pt @2x', filename: 'icon_32x32@2x.png' },
      { size: 32, label: '32pt @1x', filename: 'icon_32x32.png' },
      { size: 32, label: '16pt @2x', filename: 'icon_16x16@2x.png' },
      { size: 16, label: '16pt @1x', filename: 'icon_16x16.png' },
    ],
  },
  {
    id: 'watchos',
    name: 'watchOS',
    description: 'Apple Watch',
    icons: [
      { size: 1024, label: 'App Store', filename: 'AppIcon-Watch-1024.png' },
      { size: 196, label: 'Short Look 42mm', filename: 'AppIcon-98@2x.png' },
      { size: 172, label: 'Short Look 38mm', filename: 'AppIcon-86@2x.png' },
      { size: 100, label: 'Home 44mm', filename: 'AppIcon-50@2x.png' },
      { size: 88, label: 'Home 42mm', filename: 'AppIcon-44@2x.png' },
      { size: 80, label: 'Home 38mm', filename: 'AppIcon-40@2x.png' },
      { size: 58, label: 'Companion @2x', filename: 'AppIcon-29@2x.png' },
      { size: 87, label: 'Companion @3x', filename: 'AppIcon-29@3x.png' },
      { size: 55, label: 'Notification 42mm', filename: 'AppIcon-27.5@2x.png' },
      { size: 48, label: 'Notification 38mm', filename: 'AppIcon-24@2x.png' },
    ],
  },
  {
    id: 'web',
    name: 'Web / PWA',
    description: 'Favicons, PWA manifest',
    icons: [
      { size: 512, label: 'PWA 512', filename: 'icon-512.png' },
      { size: 384, label: 'PWA 384', filename: 'icon-384.png' },
      { size: 192, label: 'PWA 192', filename: 'icon-192.png' },
      { size: 180, label: 'Apple Touch', filename: 'apple-touch-icon.png' },
      { size: 152, label: 'Apple Touch 152', filename: 'apple-touch-icon-152.png' },
      { size: 144, label: 'MS Tile', filename: 'mstile-144.png' },
      { size: 128, label: 'Chrome Web Store', filename: 'icon-128.png' },
      { size: 96, label: 'Chrome Android', filename: 'icon-96.png' },
      { size: 72, label: 'Android Legacy', filename: 'icon-72.png' },
      { size: 48, label: 'Small', filename: 'icon-48.png' },
      { size: 32, label: 'Favicon @2x', filename: 'favicon-32.png' },
      { size: 16, label: 'Favicon', filename: 'favicon-16.png' },
    ],
  },
];

/**
 * Render icon at a specific size from a source canvas/image
 */
export function renderIconAtSize(
  source: HTMLCanvasElement,
  size: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // High-quality downscaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw source scaled to fit the square
  const srcW = source.width;
  const srcH = source.height;
  const scale = Math.max(size / srcW, size / srcH);
  const sw = srcW * scale;
  const sh = srcH * scale;
  const sx = (size - sw) / 2;
  const sy = (size - sh) / 2;

  ctx.drawImage(source, sx, sy, sw, sh);

  return canvas;
}
