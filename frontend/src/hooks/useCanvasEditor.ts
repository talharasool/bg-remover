'use client';

import { useRef, useEffect, useCallback } from 'react';
import { loadImage, renderLayers, canvasToBlob } from '@/lib/canvasCompositor';
import { useEditorStore } from '@/store/editorStore';

export function useCanvasEditor(resultUrl: string, currentFileName: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const subjectImageRef = useRef<HTMLImageElement | null>(null);
  const initedRef = useRef(false);

  const {
    layers,
    selectedLayerId,
    framePreset,
    isCustomFrame,
    customWidth,
    customHeight,
    initLayers,
    setBackgroundColor,
    setFramePreset,
    setCustomFrame,
    setCustomSize,
    setSelectedLayerId,
    reset,
  } = useEditorStore();

  const hasLayers = layers.length > 0;
  const bg = layers.find((l) => l.type === 'background');
  const hasCustomization = hasLayers && (
    (bg?.type === 'background' && (bg.color !== null || bg.gradient !== null || bg.imageUrl !== null)) ||
    framePreset !== null ||
    isCustomFrame ||
    layers.length > 2
  );

  // Load subject image and init layers once
  useEffect(() => {
    if (!resultUrl || initedRef.current) return;

    const load = async () => {
      let img: HTMLImageElement;
      try {
        img = await loadImage(resultUrl);
      } catch {
        try {
          const res = await fetch(resultUrl);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          img = await loadImage(blobUrl);
        } catch {
          return;
        }
      }
      subjectImageRef.current = img;
      initLayers(img);
      initedRef.current = true;
    };

    load();
  }, [resultUrl, initLayers]);

  // Compute canvas dimensions
  const getCanvasDimensions = useCallback(() => {
    const subject = subjectImageRef.current;
    if (!subject) return { w: 0, h: 0 };

    if (framePreset) return { w: framePreset.width, h: framePreset.height };
    if (isCustomFrame) return { w: customWidth, h: customHeight };
    return { w: subject.naturalWidth, h: subject.naturalHeight };
  }, [framePreset, isCustomFrame, customWidth, customHeight]);

  // Update canvas dimensions in store when frame changes
  useEffect(() => {
    if (!hasLayers) return;
    const { w, h } = getCanvasDimensions();
    if (w > 0 && h > 0) {
      useEditorStore.setState({ canvasWidth: w, canvasHeight: h });
    }
  }, [getCanvasDimensions, hasLayers]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasLayers) return;

    const { w, h } = getCanvasDimensions();
    if (w === 0 || h === 0) return;

    renderLayers(canvas, {
      layers,
      width: w,
      height: h,
      selectedLayerId,
      showHandles: true,
    });
  }, [layers, selectedLayerId, getCanvasDimensions, hasLayers]);

  const downloadComposite = useCallback(async () => {
    if (!hasLayers) return;

    const { w, h } = getCanvasDimensions();
    if (w === 0 || h === 0) return;

    // Render to offscreen canvas without selection handles
    const offscreen = document.createElement('canvas');
    renderLayers(offscreen, {
      layers,
      width: w,
      height: h,
      selectedLayerId: null,
      showHandles: false,
    });

    const blob = await canvasToBlob(offscreen);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clearcut-' + (currentFileName || 'image.png');
    a.click();
    URL.revokeObjectURL(url);
  }, [layers, getCanvasDimensions, hasLayers, currentFileName]);

  const exportComposite = useCallback(async (
    format: 'image/png' | 'image/jpeg' | 'image/webp',
    quality: number,
    width: number,
    height: number,
    fileName: string
  ) => {
    if (!hasLayers) return;

    const offscreen = document.createElement('canvas');
    renderLayers(offscreen, {
      layers,
      width,
      height,
      selectedLayerId: null,
      showHandles: false,
    });

    const blob = await canvasToBlob(offscreen, format, quality);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [layers, hasLayers]);

  const resetEditor = useCallback(() => {
    reset();
    initedRef.current = false;
    subjectImageRef.current = null;
  }, [reset]);

  return {
    canvasRef,
    hasCustomization,
    imageLoaded: hasLayers,
    downloadComposite,
    exportComposite,
    resetCustomization: resetEditor,
    // Frame controls (pass-through for FrameSelector compat)
    bgColor: (bg?.type === 'background' ? bg.color : null) ?? null,
    setBgColor: setBackgroundColor,
    framePreset,
    isCustomFrame,
    customWidth,
    customHeight,
    selectPreset: setFramePreset,
    selectCustom: setCustomFrame,
    setCustomSize,
    selectedLayerId,
    setSelectedLayerId,
  };
}
