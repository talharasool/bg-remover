'use client';

import { useState } from 'react';
import BackgroundPicker from './BackgroundPicker';
import FrameSelector from './FrameSelector';
import StickerPicker from './StickerPicker';
import TextEditor from './TextEditor';
import LayerList from './LayerList';
import { type FramePreset } from '@/lib/canvasCompositor';

interface EditorPanelProps {
  bgColor: string | null;
  setBgColor: (color: string | null) => void;
  framePreset: FramePreset | null;
  isCustomFrame: boolean;
  customWidth: number;
  customHeight: number;
  selectPreset: (preset: FramePreset | null) => void;
  selectCustom: () => void;
  setCustomSize: (w: number, h: number) => void;
}

type EditorTab = 'background' | 'frame' | 'stickers' | 'text' | 'layers';

const TABS: { id: EditorTab; label: string; icon: string }[] = [
  { id: 'background', label: 'Background', icon: 'M4 4h16v16H4z' },
  { id: 'frame', label: 'Frame', icon: 'M3 3h18v18H3zM7 7h10v10H7z' },
  { id: 'stickers', label: 'Stickers', icon: 'M12 2a10 10 0 110 20 10 10 0 010-20zm0 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm8 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-8 4c0 2.21 1.79 4 4 4s4-1.79 4-4H8z' },
  { id: 'text', label: 'Text', icon: 'M5 4v3h5.5v12h3V7H19V4H5z' },
  { id: 'layers', label: 'Layers', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
];

export default function EditorPanel({
  bgColor,
  setBgColor,
  framePreset,
  isCustomFrame,
  customWidth,
  customHeight,
  selectPreset,
  selectCustom,
  setCustomSize,
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('background');

  return (
    <div className="bg-surface-light border-t border-border">
      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-none cursor-pointer transition-all duration-200 whitespace-nowrap font-[inherit] ${
              activeTab === tab.id
                ? 'text-accent border-b-2 border-b-accent bg-accent/5'
                : 'text-text-muted hover:text-text bg-transparent'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-5 md:px-7 py-5">
        {activeTab === 'background' && (
          <BackgroundPicker bgColor={bgColor} setBgColor={setBgColor} />
        )}
        {activeTab === 'frame' && (
          <FrameSelector
            activePreset={framePreset}
            isCustom={isCustomFrame}
            customWidth={customWidth}
            customHeight={customHeight}
            onSelectPreset={selectPreset}
            onSelectCustom={selectCustom}
            onCustomSizeChange={setCustomSize}
          />
        )}
        {activeTab === 'stickers' && <StickerPicker />}
        {activeTab === 'text' && <TextEditor />}
        {activeTab === 'layers' && <LayerList />}
      </div>
    </div>
  );
}
