export interface FontOption {
  name: string;
  family: string;
  googleName: string; // for Google Fonts URL
}

export const FONT_OPTIONS: FontOption[] = [
  { name: 'Space Grotesk', family: 'Space Grotesk', googleName: 'Space+Grotesk' },
  { name: 'Inter', family: 'Inter', googleName: 'Inter' },
  { name: 'Roboto', family: 'Roboto', googleName: 'Roboto' },
  { name: 'Bebas Neue', family: 'Bebas Neue', googleName: 'Bebas+Neue' },
  { name: 'Playfair Display', family: 'Playfair Display', googleName: 'Playfair+Display' },
  { name: 'Montserrat', family: 'Montserrat', googleName: 'Montserrat' },
  { name: 'Oswald', family: 'Oswald', googleName: 'Oswald' },
  { name: 'Pacifico', family: 'Pacifico', googleName: 'Pacifico' },
  { name: 'Permanent Marker', family: 'Permanent Marker', googleName: 'Permanent+Marker' },
  { name: 'Dancing Script', family: 'Dancing Script', googleName: 'Dancing+Script' },
  { name: 'Press Start 2P', family: 'Press Start 2P', googleName: 'Press+Start+2P' },
  { name: 'Righteous', family: 'Righteous', googleName: 'Righteous' },
  { name: 'Archivo Black', family: 'Archivo Black', googleName: 'Archivo+Black' },
  { name: 'Satisfy', family: 'Satisfy', googleName: 'Satisfy' },
  { name: 'Russo One', family: 'Russo One', googleName: 'Russo+One' },
];

const loadedFonts = new Set<string>();

export async function loadGoogleFont(font: FontOption): Promise<void> {
  if (loadedFonts.has(font.family)) return;

  // Inject <link> tag
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleName}:wght@400;700&display=swap`;
  document.head.appendChild(link);

  // Wait for font to be ready
  try {
    await document.fonts.load(`16px "${font.family}"`);
    loadedFonts.add(font.family);
  } catch {
    // Font may still work, just not awaited
    loadedFonts.add(font.family);
  }
}
