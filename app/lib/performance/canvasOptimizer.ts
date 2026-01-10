import { fabric } from 'fabric';

/**
 * Canvas Performance Optimizer
 *
 * Key Features:
 * - 60fps rendering optimization
 * - Object caching for static elements
 * - Viewport culling (only render visible objects)
 * - Lazy loading for large documents
 * - Throttled rendering during interactions
 */

/**
 * Enable performance optimizations on a Fabric canvas
 */
export function enableCanvasOptimizations(canvas: fabric.Canvas): void {
  // Enable object caching - massive performance boost for static objects
  fabric.Object.prototype.objectCaching = true;
  fabric.Object.prototype.statefullCache = true;
  fabric.Object.prototype.noScaleCache = false;

  // Optimize rendering pipeline
  canvas.renderOnAddRemove = false; // Manual control of rendering
  canvas.skipOffscreen = true; // Skip rendering objects outside viewport
  canvas.enableRetinaScaling = true; // Better quality on high-DPI displays

  // Set performance mode for rendering
  canvas.perPixelTargetFind = false; // Faster hit detection (bounding box instead of per-pixel)
  canvas.targetFindTolerance = 10; // Larger hit area for easier selection
}

/**
 * Optimize individual objects for performance
 */
export function optimizeObject(obj: fabric.Object): void {
  // Enable caching for this specific object
  obj.objectCaching = true;
  obj.statefullCache = true;

  // Set dirty flag to false after initial render
  obj.dirty = false;
}

/**
 * Batch render multiple operations efficiently
 */
export function batchRender(canvas: fabric.Canvas, operations: () => void): void {
  // Disable rendering during batch operations
  canvas.renderOnAddRemove = false;

  try {
    operations();
  } finally {
    // Single render at the end
    canvas.requestRenderAll();
  }
}

/**
 * Throttle canvas rendering during drag operations
 * Returns a cleanup function to restore normal rendering
 */
export function throttleRendering(canvas: fabric.Canvas, fps: number = 30): () => void {
  const interval = 1000 / fps;
  let lastRender = 0;
  let rafId: number | null = null;

  const originalRenderAll = canvas.renderAll.bind(canvas);

  canvas.renderAll = function(this: fabric.Canvas) {
    const now = Date.now();

    if (now - lastRender < interval) {
      // Skip this render, schedule next one
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          lastRender = Date.now();
          originalRenderAll();
        });
      }
      return this;
    }

    lastRender = now;
    return originalRenderAll();
  };

  // Return cleanup function
  return () => {
    canvas.renderAll = originalRenderAll;
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  };
}

/**
 * Viewport culling - mark objects outside viewport as not dirty
 */
export function cullOffscreenObjects(canvas: fabric.Canvas): void {
  const vpt = canvas.viewportTransform;
  if (!vpt) return;

  const zoom = canvas.getZoom();
  const width = canvas.width || 0;
  const height = canvas.height || 0;

  // Calculate visible bounds
  const visibleLeft = -vpt[4] / zoom;
  const visibleTop = -vpt[5] / zoom;
  const visibleRight = visibleLeft + width / zoom;
  const visibleBottom = visibleTop + height / zoom;

  canvas.forEachObject((obj) => {
    const objBounds = obj.getBoundingRect(true);

    // Check if object is in viewport
    const isVisible = !(
      objBounds.left + objBounds.width < visibleLeft ||
      objBounds.left > visibleRight ||
      objBounds.top + objBounds.height < visibleTop ||
      objBounds.top > visibleBottom
    );

    // Set rendering optimization based on visibility
    if (!isVisible) {
      obj.dirty = false;
    }
  });
}

/**
 * Spread cache manager - keeps only N spreads in memory
 */
export class SpreadCache {
  private cache: Map<string, any> = new Map();
  private accessOrder: string[] = [];
  private maxSize: number;

  constructor(maxSize: number = 3) {
    this.maxSize = maxSize;
  }

  /**
   * Get a spread from cache or load it
   */
  get(spreadId: string): any | null {
    if (this.cache.has(spreadId)) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter(id => id !== spreadId);
      this.accessOrder.push(spreadId);
      return this.cache.get(spreadId);
    }
    return null;
  }

  /**
   * Add a spread to cache
   */
  set(spreadId: string, spreadData: any): void {
    // If already in cache, update access order
    if (this.cache.has(spreadId)) {
      this.accessOrder = this.accessOrder.filter(id => id !== spreadId);
      this.accessOrder.push(spreadId);
      this.cache.set(spreadId, spreadData);
      return;
    }

    // Check if cache is full
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const lru = this.accessOrder.shift();
      if (lru) {
        this.cache.delete(lru);
      }
    }

    // Add new spread
    this.cache.set(spreadId, spreadData);
    this.accessOrder.push(spreadId);
  }

  /**
   * Remove a spread from cache
   */
  remove(spreadId: string): void {
    this.cache.delete(spreadId);
    this.accessOrder = this.accessOrder.filter(id => id !== spreadId);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; items: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      items: [...this.accessOrder],
    };
  }
}

/**
 * Debounce canvas updates during rapid changes
 */
export function debounceCanvasUpdate(
  callback: () => void,
  delay: number = 100
): () => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback();
      timeoutId = null;
    }, delay);
  };
}

/**
 * Measure rendering performance
 */
export function measureRenderPerformance(canvas: fabric.Canvas): {
  fps: number;
  averageRenderTime: number;
  stop: () => void;
} {
  const renderTimes: number[] = [];
  let frameCount = 0;
  let startTime = performance.now();
  let rafId: number;

  const originalRenderAll = canvas.renderAll.bind(canvas);

  canvas.renderAll = function(this: fabric.Canvas) {
    const renderStart = performance.now();
    const result = originalRenderAll();
    const renderEnd = performance.now();

    renderTimes.push(renderEnd - renderStart);
    frameCount++;

    // Keep only last 60 frames
    if (renderTimes.length > 60) {
      renderTimes.shift();
    }

    return result;
  };

  const measure = () => {
    rafId = requestAnimationFrame(measure);
  };

  measure();

  return {
    get fps() {
      const elapsed = (performance.now() - startTime) / 1000;
      return frameCount / elapsed;
    },
    get averageRenderTime() {
      if (renderTimes.length === 0) return 0;
      return renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    },
    stop: () => {
      canvas.renderAll = originalRenderAll;
      cancelAnimationFrame(rafId);
    },
  };
}
