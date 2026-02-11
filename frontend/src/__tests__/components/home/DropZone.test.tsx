import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import DropZone from '@/components/home/DropZone';

describe('DropZone', () => {
  const onFile = vi.fn();

  function renderDropZone() {
    const fileInputRef = createRef<HTMLInputElement>();
    const result = render(<DropZone onFile={onFile} fileInputRef={fileInputRef} />);
    return { ...result, fileInputRef };
  }

  afterEach(() => {
    onFile.mockClear();
  });

  it('renders drop instruction text', () => {
    renderDropZone();
    expect(screen.getByText('Drop your image here')).toBeInTheDocument();
    expect(screen.getByText('or click anywhere to browse')).toBeInTheDocument();
  });

  it('renders supported formats info', () => {
    renderDropZone();
    expect(screen.getByText('JPG, PNG, WebP')).toBeInTheDocument();
    expect(screen.getByText('Up to 20MB')).toBeInTheDocument();
  });

  it('contains a hidden file input', () => {
    renderDropZone();
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    expect(input?.hasAttribute('hidden')).toBe(true);
  });

  it('calls onFile when a file is selected via input', () => {
    renderDropZone();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('calls onFile when a file is dropped', () => {
    renderDropZone();
    const dropzone = screen.getByText('Drop your image here').closest('div[class*="dropzone"]')!;
    const file = new File(['test'], 'test.png', { type: 'image/png' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });
    expect(onFile).toHaveBeenCalledWith(file);
  });
});
