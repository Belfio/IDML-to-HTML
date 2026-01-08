import { useState, useEffect } from 'react';
import type { IDMLTextFrame } from '~/lib/canvas/textFrame';

/**
 * TextPropertiesPanel: Character and paragraph formatting UI
 *
 * Key Features:
 * - Character formatting (font, size, color, bold/italic)
 * - Paragraph formatting (alignment, spacing)
 * - Applies changes to selected text frame
 */

interface TextPropertiesPanelProps {
  selectedObject: fabric.Object | null;
}

export function TextPropertiesPanel({ selectedObject }: TextPropertiesPanelProps) {
  const [textFrame, setTextFrame] = useState<IDMLTextFrame | null>(null);
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [textAlign, setTextAlign] = useState<string>('left');
  const [fontWeight, setFontWeight] = useState<string>('normal');
  const [fontStyle, setFontStyle] = useState<string>('normal');
  const [fillColor, setFillColor] = useState<string>('#000000');

  // Update state when selection changes
  useEffect(() => {
    if (selectedObject && (selectedObject as any).idmlId) {
      const frame = selectedObject as IDMLTextFrame;
      setTextFrame(frame);

      // Load current formatting
      setFontSize((frame.fontSize as number) || 14);
      setFontFamily((frame.fontFamily as string) || 'Arial');
      setTextAlign((frame.textAlign as string) || 'left');
      setFontWeight((frame.fontWeight as string) || 'normal');
      setFontStyle((frame.fontStyle as string) || 'normal');
      setFillColor((frame.fill as string) || '#000000');
    } else {
      setTextFrame(null);
    }
  }, [selectedObject]);

  if (!textFrame) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-400">Select a text frame to edit formatting</p>
      </div>
    );
  }

  // Handler functions
  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    textFrame.set('fontSize', newSize);
    textFrame.canvas?.requestRenderAll();
  };

  const handleFontFamilyChange = (newFamily: string) => {
    setFontFamily(newFamily);
    textFrame.set('fontFamily', newFamily);
    textFrame.canvas?.requestRenderAll();
  };

  const handleTextAlignChange = (newAlign: string) => {
    setTextAlign(newAlign);
    textFrame.set('textAlign', newAlign as any);
    textFrame.canvas?.requestRenderAll();
  };

  const handleBoldToggle = () => {
    const newWeight = fontWeight === 'bold' ? 'normal' : 'bold';
    setFontWeight(newWeight);
    textFrame.set('fontWeight', newWeight as any);
    textFrame.canvas?.requestRenderAll();
  };

  const handleItalicToggle = () => {
    const newStyle = fontStyle === 'italic' ? 'normal' : 'italic';
    setFontStyle(newStyle);
    textFrame.set('fontStyle', newStyle as any);
    textFrame.canvas?.requestRenderAll();
  };

  const handleColorChange = (newColor: string) => {
    setFillColor(newColor);
    textFrame.set('fill', newColor);
    textFrame.canvas?.requestRenderAll();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="border-b border-gray-700 pb-2">
        <h3 className="text-sm font-semibold text-white">Text Formatting</h3>
        <p className="text-xs text-gray-400 mt-1">Frame: {textFrame.idmlId}</p>
      </div>

      {/* Character Formatting */}
      <div>
        <h4 className="text-xs font-semibold text-gray-300 mb-2">CHARACTER</h4>

        {/* Font Family */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Font Family</label>
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="Arial">Arial</option>
            <option value="Arial Black">Arial Black</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Font Size</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
              className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
              min="6"
              max="144"
              step="1"
            />
            <div className="flex gap-1">
              <button
                onClick={() => handleFontSizeChange(fontSize - 1)}
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600"
              >
                -
              </button>
              <button
                onClick={() => handleFontSizeChange(fontSize + 1)}
                className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Text Color */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Text Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={fillColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-8 bg-gray-700 rounded border border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={fillColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Bold / Italic */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleBoldToggle}
            className={`flex-1 px-3 py-2 text-sm font-bold rounded border transition-colors ${
              fontWeight === 'bold'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            }`}
          >
            B
          </button>
          <button
            onClick={handleItalicToggle}
            className={`flex-1 px-3 py-2 text-sm italic rounded border transition-colors ${
              fontStyle === 'italic'
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            }`}
          >
            I
          </button>
        </div>
      </div>

      {/* Paragraph Formatting */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-xs font-semibold text-gray-300 mb-2">PARAGRAPH</h4>

        {/* Text Alignment */}
        <div className="mb-3">
          <label className="text-xs text-gray-400 block mb-1">Alignment</label>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => handleTextAlignChange('left')}
              className={`p-2 text-sm rounded border transition-colors ${
                textAlign === 'left'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              title="Left"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => handleTextAlignChange('center')}
              className={`p-2 text-sm rounded border transition-colors ${
                textAlign === 'center'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              title="Center"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => handleTextAlignChange('right')}
              className={`p-2 text-sm rounded border transition-colors ${
                textAlign === 'right'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              title="Right"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => handleTextAlignChange('justify')}
              className={`p-2 text-sm rounded border transition-colors ${
                textAlign === 'justify'
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              title="Justify"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Story Info */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-xs font-semibold text-gray-300 mb-2">STORY INFO</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Story ID: {textFrame.parentStory}</div>
          <div>
            Status: {textFrame.hasChanged() ? (
              <span className="text-yellow-400">Modified</span>
            ) : (
              <span className="text-green-400">Unchanged</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
