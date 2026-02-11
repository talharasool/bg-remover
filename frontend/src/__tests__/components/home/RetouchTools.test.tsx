import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RetouchTools from '@/components/home/RetouchTools';
import { useEditorStore } from '@/store/editorStore';

describe('RetouchTools', () => {
  const onUndo = vi.fn();
  const onRedo = vi.fn();

  beforeEach(() => {
    onUndo.mockClear();
    onRedo.mockClear();
    useEditorStore.setState({
      retouchMode: false,
      retouchTool: 'erase',
      brushSize: 20,
      brushHardness: 'hard',
      magicEraserTolerance: 30,
      isFullscreen: false,
    });
  });

  function renderRetouchTools(canUndo = false, canRedo = false) {
    return render(
      <RetouchTools onUndo={onUndo} onRedo={onRedo} canUndo={canUndo} canRedo={canRedo} />
    );
  }

  it('renders the toggle button', () => {
    renderRetouchTools();
    expect(screen.getByText('Enter Retouch Mode')).toBeInTheDocument();
  });

  it('toggles retouch mode on button click', () => {
    renderRetouchTools();
    fireEvent.click(screen.getByText('Enter Retouch Mode'));
    expect(useEditorStore.getState().retouchMode).toBe(true);
  });

  it('shows tool selection when retouch mode is active', () => {
    useEditorStore.setState({ retouchMode: true });
    renderRetouchTools();
    expect(screen.getByText('Erase')).toBeInTheDocument();
    expect(screen.getByText('Restore')).toBeInTheDocument();
    expect(screen.getByText('Magic Eraser')).toBeInTheDocument();
  });

  it('hides tool controls when retouch mode is inactive', () => {
    renderRetouchTools();
    expect(screen.queryByText('Erase')).not.toBeInTheDocument();
    expect(screen.queryByText('Restore')).not.toBeInTheDocument();
  });

  it('selects a tool when clicked', () => {
    useEditorStore.setState({ retouchMode: true });
    renderRetouchTools();
    fireEvent.click(screen.getByText('Restore'));
    expect(useEditorStore.getState().retouchTool).toBe('restore');
  });

  it('shows brush size slider for erase/restore', () => {
    useEditorStore.setState({ retouchMode: true, retouchTool: 'erase' });
    renderRetouchTools();
    expect(screen.getByText(/Brush Size: 20px/)).toBeInTheDocument();
  });

  it('updates brush size via slider', () => {
    useEditorStore.setState({ retouchMode: true, retouchTool: 'erase' });
    renderRetouchTools();
    const slider = screen.getByDisplayValue('20');
    fireEvent.change(slider, { target: { value: '50' } });
    expect(useEditorStore.getState().brushSize).toBe(50);
  });

  it('shows tolerance slider for magic eraser', () => {
    useEditorStore.setState({ retouchMode: true, retouchTool: 'magic-eraser' });
    renderRetouchTools();
    expect(screen.getByText(/Tolerance: 30/)).toBeInTheDocument();
  });

  it('hides brush size slider for magic eraser', () => {
    useEditorStore.setState({ retouchMode: true, retouchTool: 'magic-eraser' });
    renderRetouchTools();
    expect(screen.queryByText(/Brush Size/)).not.toBeInTheDocument();
  });

  it('undo button calls onUndo', () => {
    useEditorStore.setState({ retouchMode: true });
    renderRetouchTools(true, false);
    fireEvent.click(screen.getByText('Undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('redo button calls onRedo', () => {
    useEditorStore.setState({ retouchMode: true });
    renderRetouchTools(false, true);
    fireEvent.click(screen.getByText('Redo'));
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('disables undo button when canUndo is false', () => {
    useEditorStore.setState({ retouchMode: true });
    renderRetouchTools(false, true);
    const undoBtn = screen.getByText('Undo').closest('button')!;
    expect(undoBtn).toBeDisabled();
  });

  it('disables redo button when canRedo is false', () => {
    useEditorStore.setState({ retouchMode: true });
    renderRetouchTools(true, false);
    const redoBtn = screen.getByText('Redo').closest('button')!;
    expect(redoBtn).toBeDisabled();
  });

  it('shows fullscreen toggle button when in retouch mode', () => {
    useEditorStore.setState({ retouchMode: true });
    renderRetouchTools();
    expect(screen.getByText('Fullscreen')).toBeInTheDocument();
  });
});
