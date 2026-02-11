'use client';

import { useCallback, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { SubjectLayer } from '@/lib/layers';
import {
  initMaskFromAlpha,
  getSubjectTransform,
  displayToImageCoords,
  paintBrushStroke,
  paintBrushLine,
  magicErase,
  createUndoStack,
  pushSnapshot,
  undo as undoStack,
  redo as redoStack,
  UndoStack,
} from '@/lib/retouchEngine';

interface PaintState {
  lastX: number;
  lastY: number;
}

export function useRetouchBrush(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const paintRef = useRef<PaintState | null>(null);
  const rafRef = useRef<number>(0);
  const undoRef = useRef<UndoStack>(createUndoStack());

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

  const ensureMask = useCallback((): SubjectLayer | null => {
    const store = useEditorStore.getState();
    const subject = store.layers.find((l) => l.type === 'subject') as SubjectLayer | undefined;
    if (!subject?.imageElement) return null;

    if (!subject.maskCanvas) {
      const maskCanvas = initMaskFromAlpha(subject.imageElement);
      store.updateLayer(subject.id, { maskCanvas } as Partial<SubjectLayer>);
      // Push initial state to undo stack
      undoRef.current = pushSnapshot(createUndoStack(), maskCanvas);
      return { ...subject, maskCanvas } as SubjectLayer;
    }

    return subject;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const store = useEditorStore.getState();
      if (!store.retouchMode) return;

      const coords = getCanvasCoords(e.nativeEvent);
      if (!coords) return;

      const subject = ensureMask();
      if (!subject?.maskCanvas || !subject.imageElement) return;

      const { canvasWidth, canvasHeight } = store;
      const transform = getSubjectTransform(
        subject.imageElement.naturalWidth,
        subject.imageElement.naturalHeight,
        canvasWidth,
        canvasHeight,
        subject.x,
        subject.y
      );
      const imgCoords = displayToImageCoords(coords.x, coords.y, transform);

      // Bounds check
      if (
        imgCoords.x < 0 || imgCoords.x >= subject.imageElement.naturalWidth ||
        imgCoords.y < 0 || imgCoords.y >= subject.imageElement.naturalHeight
      ) return;

      // Save undo snapshot before stroke
      undoRef.current = pushSnapshot(undoRef.current, subject.maskCanvas);

      if (store.retouchTool === 'magic-eraser') {
        magicErase(
          subject.maskCanvas,
          subject.imageElement,
          imgCoords.x,
          imgCoords.y,
          store.magicEraserTolerance
        );
        store.bumpMaskVersion();
        return;
      }

      // Brush tools: paint first dab
      const mode = store.retouchTool === 'erase' ? 'erase' : 'restore';
      paintBrushStroke(
        subject.maskCanvas,
        imgCoords.x,
        imgCoords.y,
        store.brushSize,
        mode,
        store.brushHardness
      );

      paintRef.current = { lastX: imgCoords.x, lastY: imgCoords.y };
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      e.preventDefault();

      store.bumpMaskVersion();
    },
    [getCanvasCoords, ensureMask]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!paintRef.current) return;

      const store = useEditorStore.getState();
      if (!store.retouchMode || store.retouchTool === 'magic-eraser') return;

      const coords = getCanvasCoords(e.nativeEvent);
      if (!coords) return;

      e.preventDefault();

      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const paint = paintRef.current;
        if (!paint) return;

        const store = useEditorStore.getState();
        const subject = store.layers.find((l) => l.type === 'subject') as SubjectLayer | undefined;
        if (!subject?.maskCanvas || !subject.imageElement) return;

        const { canvasWidth, canvasHeight } = store;
        const transform = getSubjectTransform(
          subject.imageElement.naturalWidth,
          subject.imageElement.naturalHeight,
          canvasWidth,
          canvasHeight,
          subject.x,
          subject.y
        );
        const imgCoords = displayToImageCoords(coords.x, coords.y, transform);

        const mode = store.retouchTool === 'erase' ? 'erase' : 'restore';
        paintBrushLine(
          subject.maskCanvas,
          paint.lastX,
          paint.lastY,
          imgCoords.x,
          imgCoords.y,
          store.brushSize,
          mode,
          store.brushHardness
        );

        paintRef.current = { lastX: imgCoords.x, lastY: imgCoords.y };
        store.bumpMaskVersion();
      });
    },
    [getCanvasCoords]
  );

  const onPointerUp = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    paintRef.current = null;
  }, []);

  const handleUndo = useCallback(() => {
    const subject = useEditorStore.getState().layers.find((l) => l.type === 'subject') as SubjectLayer | undefined;
    if (!subject?.maskCanvas) return;

    const result = undoStack(undoRef.current, subject.maskCanvas);
    if (result) {
      undoRef.current = result;
      useEditorStore.getState().bumpMaskVersion();
    }
  }, []);

  const handleRedo = useCallback(() => {
    const subject = useEditorStore.getState().layers.find((l) => l.type === 'subject') as SubjectLayer | undefined;
    if (!subject?.maskCanvas) return;

    const result = redoStack(undoRef.current, subject.maskCanvas);
    if (result) {
      undoRef.current = result;
      useEditorStore.getState().bumpMaskVersion();
    }
  }, []);

  const canUndo = undoRef.current.index > 0;
  const canRedo = undoRef.current.index < undoRef.current.snapshots.length - 1;

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  };
}
