import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SpreadElement } from '../interfaces/spreadInterfaces';
import type { fabric } from 'fabric';
import type { StoryData } from '../textEditor/storyParser';
import type { IDMLColor } from '../colors/colorManager';

/**
 * EditorStore: Central state management for IDML editor
 *
 * Key Responsibilities:
 * - Store all spreads, stories, styles, colors
 * - Track current spread, selected objects
 * - Manage undo/redo history (with deep cloning)
 * - Sync state between canvas and UI
 */

export interface Style {
  id: string;
  name: string;
  properties: Record<string, any>;
}

export interface HistoryEntry {
  timestamp: number;
  spreads: SpreadElement[];
  currentSpreadIndex: number;
}

export interface EditorState {
  // Document data
  uploadId: string | null;
  fileName: string | null;
  spreads: SpreadElement[];
  stories: Record<string, StoryData>;
  styles: Style[];
  colors: IDMLColor[];

  // Current state
  currentSpreadIndex: number;
  selectedObjectIds: string[];
  canvasInstance: fabric.Canvas | null;

  // UI state
  tool: 'select' | 'text' | 'rectangle' | 'line' | 'polygon' | 'pan' | 'zoom';
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showGuides: boolean;
  showRulers: boolean;

  // History for undo/redo
  history: HistoryEntry[];
  historyIndex: number;
  maxHistorySize: number;

  // Actions
  setUploadId: (uploadId: string) => void;
  setFileName: (fileName: string) => void;
  setSpreads: (spreads: SpreadElement[]) => void;
  setStories: (stories: Record<string, StoryData>) => void;
  setStyles: (styles: Style[]) => void;
  setColors: (colors: IDMLColor[]) => void;

  setCurrentSpreadIndex: (index: number) => void;
  setSelectedObjectIds: (ids: string[]) => void;
  addSelectedObjectId: (id: string) => void;
  removeSelectedObjectId: (id: string) => void;
  clearSelection: () => void;

  setCanvasInstance: (canvas: fabric.Canvas | null) => void;
  setTool: (tool: EditorState['tool']) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleGuides: () => void;
  toggleRulers: () => void;

  // History management
  addHistoryEntry: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Utility
  getCurrentSpread: () => SpreadElement | null;
  getSpreadCount: () => number;
  reset: () => void;
}

const initialState = {
  uploadId: null,
  fileName: null,
  spreads: [],
  stories: {},
  styles: [],
  colors: [],

  currentSpreadIndex: 0,
  selectedObjectIds: [],
  canvasInstance: null,

  tool: 'select' as const,
  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: false,
  showGuides: true,
  showRulers: true,

  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
};

/**
 * Create the editor store with Zustand
 */
export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Document data setters
      setUploadId: (uploadId) => set({ uploadId }),

      setFileName: (fileName) => set({ fileName }),

      setSpreads: (spreads) => {
        set({ spreads, currentSpreadIndex: 0 });
        get().addHistoryEntry();
      },

      setStories: (stories) => set({ stories }),

      setStyles: (styles) => set({ styles }),

      setColors: (colors) => set({ colors }),

      // Current state setters
      setCurrentSpreadIndex: (index) => {
        const { spreads } = get();
        if (index >= 0 && index < spreads.length) {
          set({ currentSpreadIndex: index });
        }
      },

      setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),

      addSelectedObjectId: (id) => {
        const { selectedObjectIds } = get();
        if (!selectedObjectIds.includes(id)) {
          set({ selectedObjectIds: [...selectedObjectIds, id] });
        }
      },

      removeSelectedObjectId: (id) => {
        const { selectedObjectIds } = get();
        set({ selectedObjectIds: selectedObjectIds.filter((objId) => objId !== id) });
      },

      clearSelection: () => set({ selectedObjectIds: [] }),

      setCanvasInstance: (canvas) => set({ canvasInstance: canvas }),

      // UI state setters
      setTool: (tool) => set({ tool }),

      setZoom: (zoom) => {
        // Clamp zoom between 0.1 and 10
        const clampedZoom = Math.max(0.1, Math.min(10, zoom));
        set({ zoom: clampedZoom });

        // Apply zoom to canvas if available
        const { canvasInstance } = get();
        if (canvasInstance) {
          canvasInstance.setZoom(clampedZoom);
          canvasInstance.renderAll();
        }
      },

      setPan: (x, y) => {
        set({ panX: x, panY: y });

        // Apply pan to canvas if available
        const { canvasInstance } = get();
        if (canvasInstance) {
          canvasInstance.viewportTransform![4] = x;
          canvasInstance.viewportTransform![5] = y;
          canvasInstance.renderAll();
        }
      },

      toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

      toggleGuides: () => set((state) => ({ showGuides: !state.showGuides })),

      toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),

      // History management
      addHistoryEntry: () => {
        const { spreads, currentSpreadIndex, history, historyIndex, maxHistorySize } = get();

        // Deep clone spreads for history (to prevent mutation)
        const clonedSpreads = JSON.parse(JSON.stringify(spreads));

        const entry: HistoryEntry = {
          timestamp: Date.now(),
          spreads: clonedSpreads,
          currentSpreadIndex,
        };

        // Remove any history entries after current index (if user undid then made a change)
        const newHistory = history.slice(0, historyIndex + 1);

        // Add new entry
        newHistory.push(entry);

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();

        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          const entry = history[newIndex];

          set({
            spreads: JSON.parse(JSON.stringify(entry.spreads)),
            currentSpreadIndex: entry.currentSpreadIndex,
            historyIndex: newIndex,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();

        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          const entry = history[newIndex];

          set({
            spreads: JSON.parse(JSON.stringify(entry.spreads)),
            currentSpreadIndex: entry.currentSpreadIndex,
            historyIndex: newIndex,
          });
        }
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      // Utility methods
      getCurrentSpread: () => {
        const { spreads, currentSpreadIndex } = get();
        return spreads[currentSpreadIndex] || null;
      },

      getSpreadCount: () => {
        const { spreads } = get();
        return spreads.length;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'EditorStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * Selectors for derived state (optional, for performance optimization)
 */
export const selectCurrentSpread = (state: EditorState) => state.getCurrentSpread();
export const selectSpreadCount = (state: EditorState) => state.getSpreadCount();
export const selectCanUndo = (state: EditorState) => state.canUndo();
export const selectCanRedo = (state: EditorState) => state.canRedo();
