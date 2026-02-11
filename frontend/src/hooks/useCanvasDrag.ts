'use client';

import { useCallback, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Layer, SubjectLayer, StickerLayer, TextLayer } from '@/lib/layers';
import { measureTextLayer } from '@/lib/canvasCompositor';

interface DragState {
  layerId: string;
  startX: number;
  startY: number;
  layerStartX: number;
  layerStartY: number;
  handle: 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;
  layerStartW: number;
  layerStartH: number;
  layerStartFontSize?: number;
}

function getLayerBounds(
  layer: Layer,
  canvasW: number,
  canvasH: number
): { x: number; y: number; w: number; h: number } | null {
  if (layer.type === 'subject') {
    const sub = layer as SubjectLayer;
    if (!sub.imageElement) return null;
    const img = sub.imageElement;
    const scale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const x = (canvasW - w) / 2 + sub.x;
    const y = (canvasH - h) / 2 + sub.y;
    return { x, y, w, h };
  }

  if (layer.type === 'text') {
    const textLayer = layer as TextLayer;
    const { width, height } = measureTextLayer(textLayer);
    return { x: layer.x, y: layer.y, w: width, h: height };
  }

  if (layer.type === 'sticker') {
    return { x: layer.x, y: layer.y, w: layer.width, h: layer.height };
  }

  return null;
}

function hitTestHandle(
  mx: number,
  my: number,
  bounds: { x: number; y: number; w: number; h: number }
): 'nw' | 'ne' | 'sw' | 'se' | null {
  const hs = 18; // generous hit area for handles
  const { x, y, w, h } = bounds;

  if (Math.abs(mx - x) < hs && Math.abs(my - y) < hs) return 'nw';
  if (Math.abs(mx - (x + w)) < hs && Math.abs(my - y) < hs) return 'ne';
  if (Math.abs(mx - x) < hs && Math.abs(my - (y + h)) < hs) return 'sw';
  if (Math.abs(mx - (x + w)) < hs && Math.abs(my - (y + h)) < hs) return 'se';

  return null;
}

function canResize(layer: Layer): boolean {
  return layer.type === 'sticker' || layer.type === 'text';
}

export function useCanvasDrag(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const dragRef = useRef<DragState | null>(null);
  const rafRef = useRef<number>(0);

  const getCanvasCoords = useCallback(
    (e: PointerEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [canvasRef]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (useEditorStore.getState().retouchMode) return;

      const coords = getCanvasCoords(e.nativeEvent);
      if (!coords) return;

      const store = useEditorStore.getState();
      const { layers, selectedLayerId, canvasWidth, canvasHeight } = store;

      // Check if clicking on a resize handle of currently selected layer
      if (selectedLayerId) {
        const selected = layers.find((l) => l.id === selectedLayerId);
        if (selected && selected.type !== 'background') {
          const bounds = getLayerBounds(selected, canvasWidth, canvasHeight);
          if (bounds && canResize(selected)) {
            const handle = hitTestHandle(coords.x, coords.y, bounds);
            if (handle) {
              dragRef.current = {
                layerId: selected.id,
                startX: coords.x,
                startY: coords.y,
                layerStartX: selected.x,
                layerStartY: selected.y,
                handle,
                layerStartW: selected.type === 'sticker' ? (selected as StickerLayer).width : bounds.w,
                layerStartH: selected.type === 'sticker' ? (selected as StickerLayer).height : bounds.h,
                layerStartFontSize: selected.type === 'text' ? (selected as TextLayer).fontSize : undefined,
              };
              (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
              e.preventDefault();
              return;
            }
          }
        }
      }

      // Hit-test layers top-to-bottom (reverse order)
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (!layer.visible || layer.type === 'background') continue;

        const bounds = getLayerBounds(layer, canvasWidth, canvasHeight);
        if (!bounds) continue;

        if (
          coords.x >= bounds.x &&
          coords.x <= bounds.x + bounds.w &&
          coords.y >= bounds.y &&
          coords.y <= bounds.y + bounds.h
        ) {
          store.setSelectedLayerId(layer.id);
          dragRef.current = {
            layerId: layer.id,
            startX: coords.x,
            startY: coords.y,
            layerStartX: layer.x,
            layerStartY: layer.y,
            handle: 'move',
            layerStartW: layer.type === 'sticker' ? (layer as StickerLayer).width : bounds.w,
            layerStartH: layer.type === 'sticker' ? (layer as StickerLayer).height : bounds.h,
            layerStartFontSize: layer.type === 'text' ? (layer as TextLayer).fontSize : undefined,
          };
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          e.preventDefault();
          return;
        }
      }

      // Clicked empty area — deselect
      store.setSelectedLayerId(null);
    },
    [getCanvasCoords]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (useEditorStore.getState().retouchMode) return;
      if (!dragRef.current) return;

      const coords = getCanvasCoords(e.nativeEvent);
      if (!coords) return;

      e.preventDefault();

      // Throttle with rAF
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const drag = dragRef.current;
        if (!drag) return;

        const dx = coords.x - drag.startX;
        const dy = coords.y - drag.startY;
        const store = useEditorStore.getState();

        if (drag.handle === 'move') {
          store.updateLayer(drag.layerId, {
            x: drag.layerStartX + dx,
            y: drag.layerStartY + dy,
          });
        } else if (drag.handle) {
          const layer = store.getLayer(drag.layerId);
          if (!layer) return;

          // Sticker resize (aspect-ratio locked)
          if (layer.type === 'sticker') {
            const aspect = drag.layerStartW / drag.layerStartH;
            let newW = drag.layerStartW;
            let newH = drag.layerStartH;
            let newX = drag.layerStartX;
            let newY = drag.layerStartY;

            if (drag.handle === 'se') {
              newW = Math.max(20, drag.layerStartW + dx);
              newH = newW / aspect;
            } else if (drag.handle === 'ne') {
              newW = Math.max(20, drag.layerStartW + dx);
              newH = newW / aspect;
              newY = drag.layerStartY + (drag.layerStartH - newH);
            } else if (drag.handle === 'sw') {
              newW = Math.max(20, drag.layerStartW - dx);
              newH = newW / aspect;
              newX = drag.layerStartX + (drag.layerStartW - newW);
            } else if (drag.handle === 'nw') {
              newW = Math.max(20, drag.layerStartW - dx);
              newH = newW / aspect;
              newX = drag.layerStartX + (drag.layerStartW - newW);
              newY = drag.layerStartY + (drag.layerStartH - newH);
            }

            store.updateLayer(drag.layerId, {
              x: newX,
              y: newY,
              width: newW,
              height: newH,
            });
          }

          // Text resize — scale fontSize proportionally
          if (layer.type === 'text' && drag.layerStartFontSize) {
            const scaleAmount = drag.handle === 'se' || drag.handle === 'ne'
              ? 1 + dx / drag.layerStartW
              : 1 - dx / drag.layerStartW;
            const newFontSize = Math.max(8, Math.min(400, Math.round(drag.layerStartFontSize * scaleAmount)));

            store.updateLayer(drag.layerId, { fontSize: newFontSize });
          }
        }
      });
    },
    [getCanvasCoords]
  );

  const onPointerUp = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    dragRef.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
