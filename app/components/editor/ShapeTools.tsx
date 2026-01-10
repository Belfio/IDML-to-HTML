import { useState } from 'react';

/**
 * ShapeTools: Toolbar for creating new elements
 *
 * Key Features:
 * - Buttons for TextFrame, Rectangle, Line, Ellipse
 * - Visual feedback for selected tool
 * - Keyboard shortcuts display
 */

interface ShapeToolsProps {
  onCreateElement: (type: 'textframe' | 'rectangle' | 'line' | 'ellipse') => void;
}

export function ShapeTools({ onCreateElement }: ShapeToolsProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    {
      type: 'textframe' as const,
      label: 'Text',
      icon: 'T',
      shortcut: 'T',
      description: 'Create text frame',
    },
    {
      type: 'rectangle' as const,
      label: 'Rectangle',
      icon: '▭',
      shortcut: 'R',
      description: 'Create rectangle',
    },
    {
      type: 'line' as const,
      label: 'Line',
      icon: '─',
      shortcut: 'L',
      description: 'Create line',
    },
    {
      type: 'ellipse' as const,
      label: 'Ellipse',
      icon: '○',
      shortcut: 'E',
      description: 'Create ellipse',
    },
  ];

  const handleToolClick = (type: typeof tools[number]['type']) => {
    setActiveTool(type);
    onCreateElement(type);

    // Reset active tool after a short delay
    setTimeout(() => {
      setActiveTool(null);
    }, 500);
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
      <span className="text-gray-400 text-xs mr-2">Create:</span>

      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => handleToolClick(tool.type)}
          className={`
            group relative
            px-3 py-2
            rounded
            flex items-center gap-2
            transition-all
            ${
              activeTool === tool.type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }
          `}
          title={`${tool.description} (${tool.shortcut})`}
        >
          <span className="text-lg font-bold">{tool.icon}</span>
          <span className="text-xs hidden sm:inline">{tool.label}</span>

          {/* Keyboard shortcut hint */}
          <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-gray-300 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Press {tool.shortcut}
          </span>
        </button>
      ))}

      <div className="ml-auto text-gray-500 text-xs hidden md:block">
        Tip: Click to add at center, or drag to position
      </div>
    </div>
  );
}
