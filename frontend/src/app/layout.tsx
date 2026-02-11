import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClearCut - Background Remover',
  description: 'Professional background removal powered by AI. Fast, accurate, and privacy-focused.',
  keywords: ['background remover', 'remove background', 'AI', 'image editing', 'transparent background'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg text-text font-sans leading-normal min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
