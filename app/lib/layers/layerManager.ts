import { fabric } from 'fabric';
import type { Layer } from '~/components/editor/LayersPanel';

/**
 * LayerManager: Manage document layers
 *
 * Key Responsibilities:
 * - Extract layers from canvas objects
 * - Toggle layer visibility
 * - Lock/unlock layers
 * - Reorder layers (z-index management)
 * - Count objects per layer
 */

/**
 * Extract unique layers from canvas objects
 */
export function extractLayersFromCanvas(canvas: fabric.Canvas): Layer[] {
  const layersMap = new Map<string, Layer>();
  const objects = canvas.getObjects();

  objects.forEach(obj => {
    const layerName = obj.data?.layer || obj.data?.ItemLayer || 'Layer 1';
    const layerId = layerName.replace(/\s+/g, '-').toLowerCase();

    if (!layersMap.has(layerId)) {
      layersMap.set(layerId, {
        id: layerId,
        name: layerName,
        visible: true,
        locked: false,
        objectCount: 0,
        color: getLayerColor(layerName),
      });
    }

    const layer = layersMap.get(layerId)!;
    layer.objectCount++;

    // Check if any object in layer is hidden/locked
    if (obj.visible === false) {
      // At least one object is hidden
    }
    if (obj.data?.locked === true) {
      // At least one object is locked
    }
  });

  // Convert to array and sort by name
  return Array.from(layersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get a color for layer based on its name (for visual distinction)
 */
function getLayerColor(layerName: string): string {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#6366f1', // indigo
    '#14b8a6', // teal
  ];

  // Hash layer name to get consistent color
  let hash = 0;
  for (let i = 0; i < layerName.length; i++) {
    hash = layerName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Toggle visibility for all objects in a layer
 */
export function toggleLayerVisibility(canvas: fabric.Canvas, layerId: string, visible: boolean): void {
  const layerName = layerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const objects = canvas.getObjects();

  let count = 0;
  objects.forEach(obj => {
    const objLayer = obj.data?.layer || obj.data?.ItemLayer || 'Layer 1';
    if (objLayer === layerName || objLayer.replace(/\s+/g, '-').toLowerCase() === layerId) {
      obj.set('visible', visible);
      count++;
    }
  });

  canvas.renderAll();
  console.log(`${visible ? 'Showed' : 'Hid'} ${count} objects in layer "${layerName}"`);
}

/**
 * Lock/unlock all objects in a layer
 */
export function toggleLayerLock(canvas: fabric.Canvas, layerId: string, locked: boolean): void {
  const layerName = layerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const objects = canvas.getObjects();

  let count = 0;
  objects.forEach(obj => {
    const objLayer = obj.data?.layer || obj.data?.ItemLayer || 'Layer 1';
    if (objLayer === layerName || objLayer.replace(/\s+/g, '-').toLowerCase() === layerId) {
      obj.set({
        selectable: !locked,
        evented: !locked,
      });

      // Update data
      if (obj.data) {
        obj.data.locked = locked;
      }

      count++;
    }
  });

  canvas.renderAll();
  console.log(`${locked ? 'Locked' : 'Unlocked'} ${count} objects in layer "${layerName}"`);
}

/**
 * Move all objects in a layer to a new z-index
 */
export function reorderLayer(canvas: fabric.Canvas, layerId: string, targetIndex: number): void {
  const layerName = layerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const objects = canvas.getObjects();

  // Find all objects in this layer
  const layerObjects = objects.filter(obj => {
    const objLayer = obj.data?.layer || obj.data?.ItemLayer || 'Layer 1';
    return objLayer === layerName || objLayer.replace(/\s+/g, '-').toLowerCase() === layerId;
  });

  // Move each object to target index
  layerObjects.forEach((obj, i) => {
    canvas.moveTo(obj, targetIndex + i);
  });

  canvas.renderAll();
  console.log(`Reordered ${layerObjects.length} objects in layer "${layerName}" to index ${targetIndex}`);
}

/**
 * Get objects in a specific layer
 */
export function getLayerObjects(canvas: fabric.Canvas, layerId: string): fabric.Object[] {
  const layerName = layerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const objects = canvas.getObjects();

  return objects.filter(obj => {
    const objLayer = obj.data?.layer || obj.data?.ItemLayer || 'Layer 1';
    return objLayer === layerName || objLayer.replace(/\s+/g, '-').toLowerCase() === layerId;
  });
}

/**
 * Create a new layer by assigning objects to it
 */
export function createLayer(layerName: string): Layer {
  return {
    id: layerName.replace(/\s+/g, '-').toLowerCase(),
    name: layerName,
    visible: true,
    locked: false,
    objectCount: 0,
    color: getLayerColor(layerName),
  };
}

/**
 * Delete a layer (moves objects to default layer)
 */
export function deleteLayer(canvas: fabric.Canvas, layerId: string, defaultLayer: string = 'Layer 1'): void {
  const layerName = layerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const objects = canvas.getObjects();

  let count = 0;
  objects.forEach(obj => {
    const objLayer = obj.data?.layer || obj.data?.ItemLayer || 'Layer 1';
    if (objLayer === layerName || objLayer.replace(/\s+/g, '-').toLowerCase() === layerId) {
      if (obj.data) {
        obj.data.layer = defaultLayer;
        obj.data.ItemLayer = defaultLayer;
      }
      count++;
    }
  });

  canvas.renderAll();
  console.log(`Moved ${count} objects from layer "${layerName}" to "${defaultLayer}"`);
}
