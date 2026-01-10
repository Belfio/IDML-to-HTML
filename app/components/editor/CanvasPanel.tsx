import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '~/lib/state/editorStore';
import { FabricCanvas } from '~/lib/canvas/fabricCanvas';
import { IDMLTextFrame } from '~/lib/canvas/textFrame';
import { updateStoryFromText, serializeStoryToXML } from '~/lib/textEditor/storySerializer';
import { useFetcher } from '@remix-run/react';
import { getObjectModificationInfo } from '~/lib/canvas/transformHandler';
import {
  createNewTextFrame,
  createNewRectangle,
  createNewLine,
  createNewEllipse,
  addElementToCanvas,
} from '~/lib/canvas/elementFactory';
import {
  enableCanvasOptimizations,
  throttleRendering,
  cullOffscreenObjects,
} from '~/lib/performance/canvasOptimizer';

/**
 * CanvasPanel: Fabric.js canvas integration component
 *
 * Key Responsibilities:
 * - Render canvas element
 * - Initialize FabricCanvas on mount
 * - Load current spread onto canvas
 * - Handle spread changes
 * - Sync canvas instance with store
 * - Handle element creation
 */

interface CanvasPanelProps {
  onCanvasReady?: (createElementHandler: (type: 'textframe' | 'rectangle' | 'line' | 'ellipse') => void) => void;
}

export function CanvasPanel({ onCanvasReady }: CanvasPanelProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const fetcher = useFetcher();

  // Get state from store
  const getCurrentSpread = useEditorStore((state) => state.getCurrentSpread);
  const currentSpreadIndex = useEditorStore((state) => state.currentSpreadIndex);
  const setCanvasInstance = useEditorStore((state) => state.setCanvasInstance);
  const zoom = useEditorStore((state) => state.zoom);
  const stories = useEditorStore((state) => state.stories);
  const colors = useEditorStore((state) => state.colors);
  const uploadId = useEditorStore((state) => state.uploadId);

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
      const canvas = fabricCanvas.getCanvas();
      setCanvasInstance(canvas);

      // Enable performance optimizations
      enableCanvasOptimizations(canvas);

      // Set up throttled rendering during interactions
      const cleanupThrottle = throttleRendering(canvas, 30); // 30fps during drag

      console.log('Fabric canvas initialized with optimizations');
      setIsLoading(false);

      // Store cleanup function for throttling
      (canvas as any)._cleanupThrottle = cleanupThrottle;
    } catch (err) {
      console.error('Failed to initialize canvas:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize canvas');
      setIsLoading(false);
    }

    // Cleanup on unmount
    return () => {
      if (fabricCanvasRef.current) {
        console.log('Disposing Fabric canvas...');

        // Cleanup throttle
        const canvas = fabricCanvasRef.current.getCanvas();
        if ((canvas as any)._cleanupThrottle) {
          (canvas as any)._cleanupThrottle();
        }

        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [setCanvasInstance]);

  // Load spread onto canvas when it changes
  useEffect(() => {
    if (!fabricCanvasRef.current) {
      console.log('Skipping spread load - canvas not initialized');
      return;
    }

    const currentSpread = getCurrentSpread();
    if (!currentSpread) {
      console.log('No spread to load - spreads array may be empty');
      setIsLoading(false); // Make sure to clear loading state
      return;
    }

    console.log(`Loading spread ${currentSpreadIndex} onto canvas...`);

    // Convert stories Record to Map
    const storiesMap = new Map(Object.entries(stories));

    // Load spread asynchronously
    (async () => {
      try {
        setIsLoading(true);

        // Set stories and colors on canvas before loading spread
        fabricCanvasRef.current!.setStories(storiesMap);
        fabricCanvasRef.current!.setColors(colors);

        await fabricCanvasRef.current!.loadSpread(currentSpread);
        console.log(`Spread ${currentSpreadIndex} loaded with ${storiesMap.size} stories and ${colors.length} colors`);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load spread:', err);
        setError(err instanceof Error ? err.message : 'Failed to load spread');
        setIsLoading(false);
      }
    })();
  // Only depend on currentSpreadIndex, stories, and colors - not on the getCurrentSpread function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpreadIndex, stories, colors]);

  // Apply zoom changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current.getCanvas();
    canvas.setZoom(zoom);

    // Cull offscreen objects before rendering
    cullOffscreenObjects(canvas);

    canvas.renderAll();
  }, [zoom]);

  // Element creation handler
  const handleCreateElement = (type: 'textframe' | 'rectangle' | 'line' | 'ellipse') => {
    if (!fabricCanvasRef.current) {
      console.warn('Canvas not initialized');
      return;
    }

    const canvas = fabricCanvasRef.current.getCanvas();

    let element: fabric.Object;

    switch (type) {
      case 'textframe':
        element = createNewTextFrame(canvas);
        break;
      case 'rectangle':
        element = createNewRectangle(canvas);
        break;
      case 'line':
        element = createNewLine(canvas);
        break;
      case 'ellipse':
        element = createNewEllipse(canvas);
        break;
      default:
        console.warn(`Unknown element type: ${type}`);
        return;
    }

    // Add to canvas
    addElementToCanvas(canvas, element);
  };

  // Expose element creation handler to parent
  useEffect(() => {
    if (onCanvasReady && fabricCanvasRef.current) {
      onCanvasReady(handleCreateElement);
    }
  // Only run when onCanvasReady changes or component mounts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCanvasReady]);

  // Auto-save functionality
  useEffect(() => {
    if (!fabricCanvasRef.current || !uploadId) return;

    const canvas = fabricCanvasRef.current.getCanvas();

    // Debounced save function
    let saveTimeout: NodeJS.Timeout;

    const handleTextChange = (e: any) => {
      const target = e.target;

      // Check if it's a text frame that changed
      if (target instanceof IDMLTextFrame && target.hasChanged()) {
        clearTimeout(saveTimeout);

        // Debounce saves by 2 seconds
        saveTimeout = setTimeout(() => {
          saveTextFrame(target);
        }, 2000);
      }
    };

    const saveTextFrame = async (textFrame: IDMLTextFrame) => {
      try {
        const modInfo = textFrame.getModificationInfo();
        const originalStory = stories[modInfo.parentStory];

        if (!originalStory) {
          console.warn(`Story ${modInfo.parentStory} not found`);
          return;
        }

        // Update story with new text
        const updatedStory = updateStoryFromText(
          originalStory,
          modInfo.textData.text,
          modInfo.textData.styles
        );

        // Save via API
        fetcher.submit(
          {
            uploadId,
            storyId: modInfo.parentStory,
            storyData: JSON.stringify(updatedStory),
          },
          {
            method: 'post',
            action: '/api/save-story',
            encType: 'application/json',
          }
        );

        setLastSaveTime(new Date());
        console.log(`Auto-saved story ${modInfo.parentStory}`);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    canvas.on('text:changed', handleTextChange);
    canvas.on('object:modified', handleTextChange);

    return () => {
      canvas.off('text:changed', handleTextChange);
      canvas.off('object:modified', handleTextChange);
      clearTimeout(saveTimeout);
    };
  // Don't use fabricCanvasRef.current as dependency - it causes infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId, stories, fetcher]);

  // Auto-save transforms on object modifications
  useEffect(() => {
    if (!fabricCanvasRef.current || !uploadId) return;

    const canvas = fabricCanvasRef.current.getCanvas();
    let saveTimeout: NodeJS.Timeout;

    const handleObjectModified = (e: any) => {
      const target = e.target;

      // Skip text frames (they are handled by text save)
      if (target instanceof IDMLTextFrame) return;

      // Get modification info
      const modInfo = getObjectModificationInfo(target);
      if (!modInfo || !modInfo.modified) return;

      // Debounce saves by 2 seconds
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveTransform(target, modInfo);
      }, 2000);
    };

    const saveTransform = async (obj: any, modInfo: any) => {
      try {
        // Save via API
        fetcher.submit(
          {
            uploadId,
            spreadIndex: currentSpreadIndex.toString(),
            objectId: modInfo.idmlId,
            transform: modInfo.currentTransform,
            objectType: modInfo.idmlType,
          },
          {
            method: 'post',
            action: '/api/save-transform',
            encType: 'application/json',
          }
        );

        setLastSaveTime(new Date());
        console.log(`Auto-saved transform for ${modInfo.idmlType} ${modInfo.idmlId}`);

        // Add visual feedback (blue border)
        obj.set({
          stroke: '#3b82f6',
          strokeWidth: 2,
          dirty: true,
        });
        canvas.renderAll();

        // Remove feedback after 1 second
        setTimeout(() => {
          obj.set({
            stroke: obj.data?.originalStroke || undefined,
            strokeWidth: obj.data?.originalStrokeWidth || 0,
            dirty: true,
          });
          canvas.renderAll();
        }, 1000);
      } catch (error) {
        console.error('Transform save failed:', error);
      }
    };

    canvas.on('object:modified', handleObjectModified);

    return () => {
      canvas.off('object:modified', handleObjectModified);
      clearTimeout(saveTimeout);
    };
  // Don't use fabricCanvasRef.current as dependency - it causes infinite loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId, currentSpreadIndex, fetcher]);

  return (
    <div className="flex-1 relative bg-gray-700 overflow-hidden">
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-20">
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
      )}

      {/* Loading overlay during initialization and spread changes */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
            <p className="text-white text-xs">
              {!fabricCanvasRef.current ? 'Initializing canvas...' : 'Loading spread...'}
            </p>
          </div>
        </div>
      )}

      {/* Canvas container - always rendered so ref can be initialized */}
      <div className="w-full h-full flex items-center justify-center p-8">
        <canvas ref={canvasRef} className="shadow-2xl" />
      </div>

      {/* Canvas info overlay (bottom-left) */}
      <div className="absolute bottom-4 left-4 bg-gray-900 bg-opacity-75 rounded px-3 py-2 text-xs text-gray-300">
        <div>Zoom: {Math.round(zoom * 100)}%</div>
        <div>Spread: {currentSpreadIndex + 1}</div>
        {lastSaveTime && (
          <div className="text-green-400 mt-1">
            Saved: {lastSaveTime.toLocaleTimeString()}
          </div>
        )}
        {fetcher.state === 'submitting' && (
          <div className="text-yellow-400 mt-1">Saving...</div>
        )}
      </div>
    </div>
  );
}
