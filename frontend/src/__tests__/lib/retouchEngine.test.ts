import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSubjectTransform,
  displayToImageCoords,
  createUndoStack,
  pushSnapshot,
  undo,
  redo,
} from '@/lib/retouchEngine';

// --- Mock canvas context for jsdom ---
// jsdom doesn't implement canvas 2D context, so we provide a minimal mock
// that stores pixel data in a backing ImageData.

function createMockImageData(w: number, h: number): ImageData {
  return {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
    colorSpace: 'srgb' as PredefinedColorSpace,
  };
}

function createMockCanvas(w: number, h: number, fillAlpha = 255): { canvas: HTMLCanvasElement; backingData: ImageData } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const backingData = createMockImageData(w, h);
  for (let i = 0; i < backingData.data.length; i += 4) {
    backingData.data[i] = 255;
    backingData.data[i + 1] = 255;
    backingData.data[i + 2] = 255;
    backingData.data[i + 3] = fillAlpha;
  }

  const mockCtx = {
    createImageData: (mw: number, mh: number) => createMockImageData(mw, mh),
    getImageData: (_sx: number, _sy: number, sw: number, sh: number) => {
      // Return a copy of the backing data
      const copy = createMockImageData(sw, sh);
      copy.data.set(backingData.data.subarray(0, sw * sh * 4));
      return copy;
    },
    putImageData: (data: ImageData) => {
      backingData.data.set(data.data);
    },
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    createRadialGradient: () => ({
      addColorStop: vi.fn(),
    }),
  };

  const origGetContext = canvas.getContext.bind(canvas);
  canvas.getContext = ((type: string) => {
    if (type === '2d') return mockCtx;
    return origGetContext(type);
  }) as typeof canvas.getContext;

  return { canvas, backingData };
}

// --- Tests ---

describe('getSubjectTransform', () => {
  it('computes correct scale when image fits exactly', () => {
    const t = getSubjectTransform(100, 100, 100, 100, 0, 0);
    expect(t.scale).toBe(1);
    expect(t.offsetX).toBe(0);
    expect(t.offsetY).toBe(0);
  });

  it('scales down when image is larger than canvas', () => {
    const t = getSubjectTransform(200, 200, 100, 100, 0, 0);
    expect(t.scale).toBe(0.5);
    expect(t.offsetX).toBe(0);
    expect(t.offsetY).toBe(0);
  });

  it('centers image with aspect ratio mismatch', () => {
    const t = getSubjectTransform(200, 100, 100, 100, 0, 0);
    expect(t.scale).toBe(0.5);
    expect(t.offsetX).toBe(0);
    expect(t.offsetY).toBe(25);
  });

  it('accounts for layer position offsets', () => {
    const t = getSubjectTransform(100, 100, 100, 100, 10, 20);
    expect(t.scale).toBe(1);
    expect(t.offsetX).toBe(10);
    expect(t.offsetY).toBe(20);
  });

  it('uses smallest dimension for scale', () => {
    // tall image: 100x400 on 200x200 canvas => scale = 200/400 = 0.5
    const t = getSubjectTransform(100, 400, 200, 200, 0, 0);
    expect(t.scale).toBe(0.5);
    // Displayed: 50x200, centered horizontally => offsetX = 75
    expect(t.offsetX).toBe(75);
    expect(t.offsetY).toBe(0);
  });
});

describe('displayToImageCoords', () => {
  it('returns identity when scale is 1 and offset is 0', () => {
    const transform = { scale: 1, offsetX: 0, offsetY: 0 };
    const result = displayToImageCoords(50, 50, transform);
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
  });

  it('inverts scale correctly', () => {
    const transform = { scale: 0.5, offsetX: 0, offsetY: 0 };
    const result = displayToImageCoords(25, 25, transform);
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
  });

  it('accounts for offset', () => {
    const transform = { scale: 1, offsetX: 10, offsetY: 20 };
    const result = displayToImageCoords(60, 70, transform);
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
  });

  it('round-trips with getSubjectTransform', () => {
    const t = getSubjectTransform(200, 100, 100, 100, 5, 10);
    const displayX = 50 * t.scale + t.offsetX;
    const displayY = 30 * t.scale + t.offsetY;
    const back = displayToImageCoords(displayX, displayY, t);
    expect(back.x).toBeCloseTo(50, 5);
    expect(back.y).toBeCloseTo(30, 5);
  });

  it('round-trips with large scale factor', () => {
    // Small image on large canvas
    const t = getSubjectTransform(50, 50, 500, 500, 0, 0);
    expect(t.scale).toBe(10);
    const displayX = 25 * t.scale + t.offsetX;
    const displayY = 25 * t.scale + t.offsetY;
    const back = displayToImageCoords(displayX, displayY, t);
    expect(back.x).toBeCloseTo(25, 5);
    expect(back.y).toBeCloseTo(25, 5);
  });
});

describe('Undo/Redo stack', () => {
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    const mock = createMockCanvas(10, 10, 255);
    mockCanvas = mock.canvas;
  });

  it('creates an empty stack', () => {
    const stack = createUndoStack();
    expect(stack.snapshots).toHaveLength(0);
    expect(stack.index).toBe(-1);
  });

  it('pushSnapshot adds a snapshot', () => {
    let stack = createUndoStack();
    stack = pushSnapshot(stack, mockCanvas);
    expect(stack.snapshots).toHaveLength(1);
    expect(stack.index).toBe(0);
  });

  it('pushSnapshot adds multiple snapshots', () => {
    let stack = createUndoStack();
    stack = pushSnapshot(stack, mockCanvas);
    stack = pushSnapshot(stack, mockCanvas);
    stack = pushSnapshot(stack, mockCanvas);
    expect(stack.snapshots).toHaveLength(3);
    expect(stack.index).toBe(2);
  });

  it('undo returns null when at beginning', () => {
    let stack = createUndoStack();
    stack = pushSnapshot(stack, mockCanvas);
    const result = undo(stack, mockCanvas);
    expect(result).toBeNull();
  });

  it('undo returns null on empty stack', () => {
    const stack = createUndoStack();
    const result = undo(stack, mockCanvas);
    expect(result).toBeNull();
  });

  it('undo moves index back', () => {
    let stack = createUndoStack();
    stack = pushSnapshot(stack, mockCanvas);
    stack = pushSnapshot(stack, mockCanvas);
    expect(stack.index).toBe(1);

    const result = undo(stack, mockCanvas);
    expect(result).not.toBeNull();
    expect(result!.index).toBe(0);
  });

  it('redo moves index forward', () => {
    let stack = createUndoStack();
    stack = pushSnapshot(stack, mockCanvas);
    stack = pushSnapshot(stack, mockCanvas);

    const undone = undo(stack, mockCanvas)!;
    const redone = redo(undone, mockCanvas);
    expect(redone).not.toBeNull();
    expect(redone!.index).toBe(1);
  });

  it('redo returns null when at end', () => {
    let stack = createUndoStack();
    stack = pushSnapshot(stack, mockCanvas);
    const result = redo(stack, mockCanvas);
    expect(result).toBeNull();
  });

  it('redo returns null on empty stack', () => {
    const stack = createUndoStack();
    const result = redo(stack, mockCanvas);
    expect(result).toBeNull();
  });

  it('enforces max snapshot limit (15)', () => {
    let stack = createUndoStack();
    for (let i = 0; i < 20; i++) {
      stack = pushSnapshot(stack, mockCanvas);
    }
    expect(stack.snapshots.length).toBeLessThanOrEqual(15);
    expect(stack.index).toBe(stack.snapshots.length - 1);
  });

  it('push after undo discards redo history', () => {
    let stack = createUndoStack();
    stack = pushSnapshot(stack, mockCanvas);
    stack = pushSnapshot(stack, mockCanvas);
    stack = pushSnapshot(stack, mockCanvas);

    stack = undo(stack, mockCanvas)!;
    stack = pushSnapshot(stack, mockCanvas);
    expect(stack.snapshots).toHaveLength(3);
    expect(stack.index).toBe(2);
  });

  it('multiple undo then redo restores correctly', () => {
    let stack = createUndoStack();
    stack = pushSnapshot(stack, mockCanvas);
    stack = pushSnapshot(stack, mockCanvas);
    stack = pushSnapshot(stack, mockCanvas);

    stack = undo(stack, mockCanvas)!; // index 1
    stack = undo(stack, mockCanvas)!; // index 0
    expect(stack.index).toBe(0);

    stack = redo(stack, mockCanvas)!; // index 1
    stack = redo(stack, mockCanvas)!; // index 2
    expect(stack.index).toBe(2);
  });
});
