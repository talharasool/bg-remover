'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { renderComposite, canvasToBlob, loadImage, type FramePreset } from '@/lib/canvasCompositor';

export function useCanvasCustomization(resultUrl: string, currentFileName: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const subjectImageRef = useRef<HTMLImageElement | null>(null);

  const [bgColor, setBgColor] = useState<string | null>(null);
  const [framePreset, setFramePreset] = useState<FramePreset | null>(null);
  const [isCustomFrame, setIsCustomFrame] = useState(false);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasCustomization = bgColor !== null || framePreset !== null || isCustomFrame;

  // Load subject image once
  useEffect(() => {
    if (!resultUrl) return;
    setImageLoaded(false);

    // Try direct load first, fall back to blob fetch for CORS
    loadImage(resultUrl)
      .then((img) => {
        subjectImageRef.current = img;
        setImageLoaded(true);
      })
      .catch(async () => {
        try {
          const res = await fetch(resultUrl);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const img = await loadImage(blobUrl);
          subjectImageRef.current = img;
          setImageLoaded(true);
        } catch {
          // silently fail — canvas preview won't render
        }
      });
  }, [resultUrl]);

  // Re-render canvas on every state change
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = subjectImageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    let fw: number | null = null;
    let fh: number | null = null;

    if (framePreset) {
      fw = framePreset.width;
      fh = framePreset.height;
    } else if (isCustomFrame) {
      fw = customWidth;
      fh = customHeight;
    }

    renderComposite(canvas, {
      subjectImage: img,
      bgColor,
      frameWidth: fw,
      frameHeight: fh,
    });
  }, [bgColor, framePreset, isCustomFrame, customWidth, customHeight, imageLoaded]);

  const selectPreset = useCallback((preset: FramePreset | null) => {
    setFramePreset(preset);
    setIsCustomFrame(false);
  }, []);

  const selectCustom = useCallback(() => {
    setFramePreset(null);
    setIsCustomFrame(true);
  }, []);

  const setCustomSize = useCallback((w: number, h: number) => {
    setCustomWidth(w);
    setCustomHeight(h);
  }, []);

  const downloadComposite = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clearcut-' + (currentFileName || 'image.png');
    a.click();
    URL.revokeObjectURL(url);
  }, [currentFileName]);

  const resetCustomization = useCallback(() => {
    setBgColor(null);
    setFramePreset(null);
    setIsCustomFrame(false);
    setCustomWidth(1080);
    setCustomHeight(1080);
  }, []);

  return {
    canvasRef,
    bgColor,
    setBgColor,
    framePreset,
    isCustomFrame,
    customWidth,
    customHeight,
    selectPreset,
    selectCustom,
    setCustomSize,
    hasCustomization,
    imageLoaded,
    downloadComposite,
    resetCustomization,
  };
}
