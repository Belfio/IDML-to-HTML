import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { useEffect, useCallback } from 'react';
import { readFile, readdir } from 'fs/promises';
import path from 'path';
import * as xml2js from 'xml2js';
import { useEditorStore } from '~/lib/state/editorStore';
import type { SpreadXML, SpreadElement } from '~/lib/interfaces/spreadInterfaces';

/**
 * Editor Route: Main IDML editor interface
 *
 * Key Responsibilities:
 * - Load all IDML data (spreads, stories, styles, colors)
 * - Initialize editor state
 * - Render 3-panel InDesign-like layout
 * - Handle keyboard shortcuts
 * - Initialize canvas with first spread
 */

interface LoaderData {
  uploadId: string;
  fileName: string;
  spreads: SpreadElement[];
  spreadFiles: string[];
  error?: string;
}

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return json({ error: 'No upload ID provided' }, { status: 400 });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'uploads', id);

    // Find the IDML file
    const files = await readdir(uploadDir);
    const idmlFile = files.find((f) => f.endsWith('.idml'));

    if (!idmlFile) {
      return json({ error: 'IDML file not found' }, { status: 404 });
    }

    // Read extracted spreads
    const extractedDir = path.join(uploadDir, 'extracted');
    const spreadsDir = path.join(extractedDir, 'Spreads');

    // Get all spread files
    const spreadFiles = await readdir(spreadsDir);
    console.log(`Found ${spreadFiles.length} spreads:`, spreadFiles);

    // Parse all spreads
    const spreads: SpreadElement[] = [];
    const parser = new xml2js.Parser();

    for (const spreadFile of spreadFiles) {
      const spreadPath = path.join(spreadsDir, spreadFile);
      const spreadXML = await readFile(spreadPath, 'utf-8');

      try {
        const result: SpreadXML = await parser.parseStringPromise(spreadXML);
        const spread = result['idPkg:Spread'].Spread[0];
        spreads.push(spread);
      } catch (parseError) {
        console.error(`Failed to parse spread ${spreadFile}:`, parseError);
      }
    }

    console.log(`Successfully parsed ${spreads.length} spreads`);

    return json<LoaderData>({
      uploadId: id,
      fileName: idmlFile,
      spreads,
      spreadFiles,
    });
  } catch (error) {
    console.error('Editor loader error:', error);
    return json(
      {
        error: error instanceof Error ? error.message : 'Failed to load editor',
        uploadId: id,
        fileName: '',
        spreads: [],
        spreadFiles: [],
      },
      { status: 500 }
    );
  }
};

export default function Editor() {
  const data = useLoaderData<LoaderData>();
  const navigate = useNavigate();

  // Get store actions
  const setUploadId = useEditorStore((state) => state.setUploadId);
  const setFileName = useEditorStore((state) => state.setFileName);
  const setSpreads = useEditorStore((state) => state.setSpreads);
  const setCurrentSpreadIndex = useEditorStore((state) => state.setCurrentSpreadIndex);
  const currentSpreadIndex = useEditorStore((state) => state.currentSpreadIndex);
  const spreadCount = useEditorStore((state) => state.getSpreadCount());
  const tool = useEditorStore((state) => state.tool);
  const setTool = useEditorStore((state) => state.setTool);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.canUndo());
  const canRedo = useEditorStore((state) => state.canRedo());

  // Initialize editor state on mount
  useEffect(() => {
    if (data.uploadId && data.spreads.length > 0) {
      setUploadId(data.uploadId);
      setFileName(data.fileName);
      setSpreads(data.spreads);
      setCurrentSpreadIndex(0);

      console.log('Editor initialized with:', {
        uploadId: data.uploadId,
        fileName: data.fileName,
        spreadCount: data.spreads.length,
      });
    }
  }, [data, setUploadId, setFileName, setSpreads, setCurrentSpreadIndex]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z: Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }

      // Cmd/Ctrl + Shift + Z: Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }

      // Tool shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        switch (e.key) {
          case 'v':
            setTool('select');
            break;
          case 't':
            setTool('text');
            break;
          case 'r':
            setTool('rectangle');
            break;
          case 'l':
            setTool('line');
            break;
          case 'h':
            setTool('pan');
            break;
          case 'z':
            setTool('zoom');
            break;
        }
      }

      // Page navigation
      if (e.key === 'ArrowLeft' && currentSpreadIndex > 0) {
        setCurrentSpreadIndex(currentSpreadIndex - 1);
      }
      if (e.key === 'ArrowRight' && currentSpreadIndex < spreadCount - 1) {
        setCurrentSpreadIndex(currentSpreadIndex + 1);
      }
    },
    [
      canUndo,
      canRedo,
      undo,
      redo,
      setTool,
      currentSpreadIndex,
      spreadCount,
      setCurrentSpreadIndex,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Error handling
  if (data.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg
              className="w-6 h-6 text-red-600"
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
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
            Failed to Load Editor
          </h2>
          <p className="text-gray-600 text-center mb-6">{data.error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  // Main editor interface
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Top Menu Bar */}
      <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h1 className="text-sm font-semibold">{data.fileName}</h1>
          <span className="text-xs text-gray-400">
            Spread {currentSpreadIndex + 1} of {spreadCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            className={`px-3 py-1 text-xs rounded ${
              canUndo
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
            title="Undo (Cmd+Z)"
          >
            Undo
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            className={`px-3 py-1 text-xs rounded ${
              canRedo
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
            title="Redo (Cmd+Shift+Z)"
          >
            Redo
          </button>
          <div className="w-px h-6 bg-gray-700 mx-2" />
          <button className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded">
            Export
          </button>
        </div>
      </header>

      {/* Main Editor Area - 3 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tools */}
        <aside className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 gap-2">
          <ToolButton
            icon="cursor"
            label="Select (V)"
            active={tool === 'select'}
            onClick={() => setTool('select')}
          />
          <ToolButton
            icon="text"
            label="Text (T)"
            active={tool === 'text'}
            onClick={() => setTool('text')}
          />
          <ToolButton
            icon="square"
            label="Rectangle (R)"
            active={tool === 'rectangle'}
            onClick={() => setTool('rectangle')}
          />
          <ToolButton
            icon="line"
            label="Line (L)"
            active={tool === 'line'}
            onClick={() => setTool('line')}
          />
          <div className="w-8 h-px bg-gray-700 my-2" />
          <ToolButton
            icon="hand"
            label="Pan (H)"
            active={tool === 'pan'}
            onClick={() => setTool('pan')}
          />
          <ToolButton
            icon="zoom"
            label="Zoom (Z)"
            active={tool === 'zoom'}
            onClick={() => setTool('zoom')}
          />
        </aside>

        {/* Center Panel - Canvas */}
        <main className="flex-1 bg-gray-700 flex flex-col">
          {/* Canvas Toolbar */}
          <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  currentSpreadIndex > 0 && setCurrentSpreadIndex(currentSpreadIndex - 1)
                }
                disabled={currentSpreadIndex === 0}
                className="text-gray-400 hover:text-white disabled:opacity-30"
              >
                ←
              </button>
              <span className="text-xs text-gray-300">
                {currentSpreadIndex + 1} / {spreadCount}
              </span>
              <button
                onClick={() =>
                  currentSpreadIndex < spreadCount - 1 &&
                  setCurrentSpreadIndex(currentSpreadIndex + 1)
                }
                disabled={currentSpreadIndex >= spreadCount - 1}
                className="text-gray-400 hover:text-white disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <div className="bg-white rounded shadow-2xl">
              <div className="p-8">
                <p className="text-gray-500 text-center">
                  Canvas will be rendered here
                  <br />
                  <span className="text-xs">(Phase 1 - Canvas components pending)</span>
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - Properties */}
        <aside className="w-64 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold mb-4">Properties</h2>
          <div className="text-xs text-gray-400">
            <p>No object selected</p>
            <p className="mt-4">Select an object to view properties</p>
          </div>
        </aside>
      </div>

      {/* Bottom Panel - Pages Thumbnails (collapsed by default) */}
      <div className="h-24 bg-gray-800 border-t border-gray-700 hidden">
        {/* Will be implemented in Phase 1 */}
      </div>
    </div>
  );
}

/**
 * Tool Button Component
 */
interface ToolButtonProps {
  icon: 'cursor' | 'text' | 'square' | 'line' | 'hand' | 'zoom';
  label: string;
  active: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, active, onClick }: ToolButtonProps) {
  const icons = {
    cursor: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
      />
    ),
    text: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    ),
    square: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
      />
    ),
    line: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19l14-14" />
    ),
    hand: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
      />
    ),
    zoom: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
      />
    ),
  };

  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[icon]}
      </svg>
    </button>
  );
}
