import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '~/lib/state/editorStore';
import { FabricCanvas } from '~/lib/canvas/fabricCanvas';

/**
 * CanvasPanel: Fabric.js canvas integration component
 *
 * Key Responsibilities:
 * - Render canvas element
 * - Initialize FabricCanvas on mount
 * - Load current spread onto canvas
 * - Handle spread changes
 * - Sync canvas instance with store
 */

export function CanvasPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get state from store
  const getCurrentSpread = useEditorStore((state) => state.getCurrentSpread);
  const currentSpreadIndex = useEditorStore((state) => state.currentSpreadIndex);
  const setCanvasInstance = useEditorStore((state) => state.setCanvasInstance);
  const zoom = useEditorStore((state) => state.zoom);

  // Initialize canvas on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      console.log('Initializing Fabric canvas...');

      // Create FabricCanvas instance
      const fabricCanvas = new FabricCanvas(canvasRef.current, {
        width: 1200,
        height: 800,
        backgroundColor: '#f5f5f5',
        selection: true,
      });

      fabricCanvasRef.current = fabricCanvas;

      // Store canvas instance in Zustand
      setCanvasInstance(fabricCanvas.getCanvas());

      console.log('Fabric canvas initialized');
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize canvas:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize canvas');
      setIsLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (fabricCanvasRef.current) {
        console.log('Disposing Fabric canvas...');
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [setCanvasInstance]);

  // Load spread onto canvas when it changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const currentSpread = getCurrentSpread();
    if (!currentSpread) {
      console.log('No spread to load');
      return;
    }

    console.log(`Loading spread ${currentSpreadIndex} onto canvas...`);

    // Load spread asynchronously
    (async () => {
      try {
        setIsLoading(true);
        await fabricCanvasRef.current!.loadSpread(currentSpread);
        console.log(`Spread ${currentSpreadIndex} loaded successfully`);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load spread:', err);
        setError(err instanceof Error ? err.message : 'Failed to load spread');
        setIsLoading(false);
      }
    })();
  }, [currentSpreadIndex, getCurrentSpread]);

  // Apply zoom changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current.getCanvas();
    canvas.setZoom(zoom);
    canvas.renderAll();
  }, [zoom]);

  // Loading state
  if (isLoading && !fabricCanvasRef.current) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-700">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white text-sm">Initializing canvas...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-700">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">Canvas Error</h3>
          <p className="text-gray-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-gray-700 overflow-hidden">
      {/* Loading overlay during spread changes */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
            <p className="text-white text-xs">Loading spread...</p>
          </div>
        </div>
      )}

      {/* Canvas container */}
      <div className="w-full h-full flex items-center justify-center p-8">
        <canvas ref={canvasRef} className="shadow-2xl" />
      </div>

      {/* Canvas info overlay (bottom-left) */}
      <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-75 rounded px-3 py-2 text-xs text-gray-300">
        <div>Zoom: {Math.round(zoom * 100)}%</div>
        <div>Spread: {currentSpreadIndex + 1}</div>
      </div>
    </div>
  );
}
