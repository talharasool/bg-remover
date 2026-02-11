import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExportDialog from '@/components/home/ExportDialog';

describe('ExportDialog', () => {
  const onExport = vi.fn();
  const onClose = vi.fn();

  const defaultProps = {
    canvasWidth: 1920,
    canvasHeight: 1080,
    currentFileName: 'photo.png',
    onExport,
    onClose,
  };

  beforeEach(() => {
    onExport.mockClear();
    onClose.mockClear();
  });

  function renderDialog(props = {}) {
    return render(<ExportDialog {...defaultProps} {...props} />);
  }

  it('renders the dialog title', () => {
    renderDialog();
    expect(screen.getByText('Export Image')).toBeInTheDocument();
  });

  it('renders format options', () => {
    renderDialog();
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('JPEG')).toBeInTheDocument();
    expect(screen.getByText('WebP')).toBeInTheDocument();
  });

  it('hides quality slider for PNG', () => {
    renderDialog();
    expect(screen.queryByText(/Quality/)).not.toBeInTheDocument();
  });

  it('shows quality slider for JPEG', () => {
    renderDialog();
    fireEvent.click(screen.getByText('JPEG'));
    expect(screen.getByText(/Quality: 90%/)).toBeInTheDocument();
  });

  it('shows quality slider for WebP', () => {
    renderDialog();
    fireEvent.click(screen.getByText('WebP'));
    expect(screen.getByText(/Quality: 90%/)).toBeInTheDocument();
  });

  it('renders dimension inputs with canvas dimensions', () => {
    renderDialog();
    const widthInput = screen.getByDisplayValue('1920');
    const heightInput = screen.getByDisplayValue('1080');
    expect(widthInput).toBeInTheDocument();
    expect(heightInput).toBeInTheDocument();
  });

  it('updates height when width changes with aspect lock', () => {
    renderDialog();
    const widthInput = screen.getByDisplayValue('1920');
    fireEvent.change(widthInput, { target: { value: '960' } });
    // 960 / (1920/1080) = 540
    expect(screen.getByDisplayValue('540')).toBeInTheDocument();
  });

  it('does not lock height when aspect ratio is unlocked', () => {
    renderDialog();
    // Click the lock toggle to unlock
    fireEvent.click(screen.getByText('Locked'));
    expect(screen.getByText('Unlocked')).toBeInTheDocument();

    const widthInput = screen.getByDisplayValue('1920');
    fireEvent.change(widthInput, { target: { value: '800' } });
    // Height should remain 1080
    expect(screen.getByDisplayValue('1080')).toBeInTheDocument();
  });

  it('calls onExport with correct params on download', () => {
    renderDialog();
    fireEvent.click(screen.getByText('Download'));
    expect(onExport).toHaveBeenCalledWith(
      'image/png',
      0.9,
      1920,
      1080,
      'clearcut-photo.png'
    );
  });

  it('calls onExport with JPEG format and correct extension', () => {
    renderDialog();
    fireEvent.click(screen.getByText('JPEG'));
    fireEvent.click(screen.getByText('Download'));
    expect(onExport).toHaveBeenCalledWith(
      'image/jpeg',
      0.9,
      1920,
      1080,
      'clearcut-photo.jpg'
    );
  });

  it('calls onClose after download', () => {
    renderDialog();
    fireEvent.click(screen.getByText('Download'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    renderDialog();
    // Click the backdrop (outer div)
    const backdrop = screen.getByText('Export Image').closest('.fixed')!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when dialog body is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByText('Export Image'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
