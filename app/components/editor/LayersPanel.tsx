import { useState } from 'react';

/**
 * LayersPanel: Manage document layers
 *
 * Key Features:
 * - Display all layers in document
 * - Toggle layer visibility
 * - Lock/unlock layers
 * - Reorder layers (drag and drop)
 * - Show object count per layer
 */

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  objectCount: number;
  color?: string; // Layer color for visual identification
}

interface LayersPanelProps {
  layers: Layer[];
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onReorderLayers?: (layers: Layer[]) => void;
  onSelectLayer?: (layerId: string) => void;
  selectedLayerId?: string;
}

export function LayersPanel({
  layers,
  onToggleVisibility,
  onToggleLock,
  onReorderLayers,
  onSelectLayer,
  selectedLayerId,
}: LayersPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    if (onReorderLayers) {
      setDraggedIndex(index);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || !onReorderLayers) return;

    const newLayers = [...layers];
    const draggedLayer = newLayers[draggedIndex];
    newLayers.splice(draggedIndex, 1);
    newLayers.splice(index, 0, draggedLayer);

    onReorderLayers(newLayers);
    setDraggedIndex(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">Layers</h3>
      </div>

      <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-4">
            No layers found
          </div>
        ) : (
          layers.map((layer, index) => (
            <div
              key={layer.id}
              draggable={!!onReorderLayers}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onClick={() => onSelectLayer?.(layer.id)}
              className={`
                group flex items-center gap-2 px-2 py-2 rounded
                cursor-pointer transition-colors
                ${
                  selectedLayerId === layer.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }
                ${draggedIndex === index ? 'opacity-50' : ''}
              `}
            >
              {/* Layer color indicator */}
              {layer.color && (
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
              )}

              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(layer.id);
                }}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-gray-600 rounded"
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                )}
              </button>

              {/* Lock toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(layer.id);
                }}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center hover:bg-gray-600 rounded"
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {layer.locked ? (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                  </svg>
                )}
              </button>

              {/* Layer name */}
              <span className="flex-1 text-sm truncate">{layer.name}</span>

              {/* Object count */}
              <span className="flex-shrink-0 text-xs opacity-60">
                {layer.objectCount}
              </span>

              {/* Drag handle */}
              {onReorderLayers && (
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm0 4a1 1 0 112 0 1 1 0 01-2 0zm4 0a1 1 0 112 0 1 1 0 01-2 0zm-4 4a1 1 0 112 0 1 1 0 01-2 0zm4 0a1 1 0 112 0 1 1 0 01-2 0zm-4 4a1 1 0 112 0 1 1 0 01-2 0zm4 0a1 1 0 112 0 1 1 0 01-2 0z" />
                  </svg>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      <div className="px-2 py-2 border-t border-gray-700 flex gap-2">
        <button
          className="flex-1 text-xs py-1 px-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
          title="New layer"
        >
          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          className="flex-1 text-xs py-1 px-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors disabled:opacity-30"
          title="Delete layer"
          disabled={layers.length <= 1}
        >
          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
