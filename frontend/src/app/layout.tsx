import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Background Remover - AI-Powered Image Background Removal',
  description: 'Remove backgrounds from images instantly with AI. Free, fast, and beautifully simple. Powered by BiRefNet.',
  keywords: ['background remover', 'remove background', 'AI', 'image editing', 'transparent background'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
