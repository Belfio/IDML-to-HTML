import { fabric } from 'fabric';

/**
 * TransformHandler: Manages drag, resize, rotate operations and IDML transform updates
 *
 * Key Responsibilities:
 * - Enable drag/resize/rotate on canvas objects
 * - Track transform changes
 * - Compose Fabric transforms back to IDML ItemTransform matrix
 * - Store modifications for later export
 */

/**
 * Compose Fabric transform properties into IDML ItemTransform matrix
 *
 * IDML ItemTransform format: "a b c d tx ty"
 * Matrix: [a b c d tx ty]
 * - a, d: scale
 * - b, c: skew/rotation
 * - tx, ty: translation (in points)
 *
 * This is the reverse of parseItemTransform
 *
 * @param obj - Fabric object with transform properties
 * @param pointsToPixelsRatio - Conversion ratio (default 0.75)
 * @returns IDML ItemTransform string
 */
export function composeItemTransform(obj: fabric.Object, pointsToPixelsRatio: number = 0.75): string {
  const scaleX = obj.scaleX || 1;
  const scaleY = obj.scaleY || 1;
  const angle = obj.angle || 0;
  const left = obj.left || 0;
  const top = obj.top || 0;
  const skewX = obj.skewX || 0;

  // Convert angle to radians
  const angleRad = (angle * Math.PI) / 180;
  const skewXRad = (skewX * Math.PI) / 180;

  // Compose the matrix
  // For rotation: a = cos(θ), b = sin(θ), c = -sin(θ), d = cos(θ)
  // For scale: multiply by scaleX and scaleY
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const a = scaleX * cos;
  const b = scaleX * sin;
  const c = scaleY * (Math.sin(skewXRad - angleRad));
  const d = scaleY * cos;

  // Translation: convert pixels to points
  const tx = left / pointsToPixelsRatio;
  const ty = top / pointsToPixelsRatio;

  // Format to IDML string with 6 decimal places
  return `${a.toFixed(6)} ${b.toFixed(6)} ${c.toFixed(6)} ${d.toFixed(6)} ${tx.toFixed(6)} ${ty.toFixed(6)}`;
}

/**
 * Enable drag, resize, and rotate controls on canvas objects
 */
export function enableObjectControls(obj: fabric.Object, options?: {
  selectable?: boolean;
  hasControls?: boolean;
  hasBorders?: boolean;
  lockMovementX?: boolean;
  lockMovementY?: boolean;
  lockRotation?: boolean;
  lockScalingX?: boolean;
  lockScalingY?: boolean;
}): void {
  obj.set({
    selectable: options?.selectable !== false,
    hasControls: options?.hasControls !== false,
    hasBorders: options?.hasBorders !== false,
    lockMovementX: options?.lockMovementX || false,
    lockMovementY: options?.lockMovementY || false,
    lockRotation: options?.lockRotation || false,
    lockScalingX: options?.lockScalingX || false,
    lockScalingY: options?.lockScalingY || false,
  });
}

/**
 * Mark an object as modified and update its IDML transform
 */
export function markObjectModified(obj: fabric.Object, pointsToPixelsRatio: number = 0.75): void {
  const data = obj.data || {};

  // Update the ItemTransform in object data
  const newTransform = composeItemTransform(obj, pointsToPixelsRatio);

  obj.set('data', {
    ...data,
    modified: true,
    modifiedAt: Date.now(),
    originalTransform: data.originalTransform || data.ItemTransform,
    ItemTransform: newTransform,
  });
}

/**
 * Setup canvas event listeners for tracking modifications
 */
export function setupTransformTracking(canvas: fabric.Canvas, pointsToPixelsRatio: number = 0.75): void {
  // Track object modifications (move, scale, rotate)
  canvas.on('object:modified', (e) => {
    if (e.target) {
      markObjectModified(e.target, pointsToPixelsRatio);
      console.log('Object modified:', e.target.data?.idmlId, 'New transform:', e.target.data?.ItemTransform);
    }
  });

  // Track object moving (for real-time feedback)
  canvas.on('object:moving', (e) => {
    if (e.target) {
      // Could add snap-to-grid logic here in Phase 5
    }
  });

  // Track object scaling
  canvas.on('object:scaling', (e) => {
    if (e.target) {
      // Could add constraint logic here
    }
  });

  // Track object rotating
  canvas.on('object:rotating', (e) => {
    if (e.target) {
      // Could add snap-to-angle logic here
    }
  });
}

/**
 * Get all modified objects from canvas
 */
export function getModifiedObjects(canvas: fabric.Canvas): fabric.Object[] {
  return canvas.getObjects().filter(obj => obj.data?.modified === true);
}

/**
 * Get modification info for an object
 */
export function getObjectModificationInfo(obj: fabric.Object): {
  idmlId: string;
  idmlType: string;
  originalTransform: string;
  currentTransform: string;
  modified: boolean;
  modifiedAt?: number;
} | null {
  const data = obj.data;
  if (!data) return null;

  return {
    idmlId: data.idmlId,
    idmlType: data.idmlType,
    originalTransform: data.originalTransform || data.ItemTransform,
    currentTransform: data.ItemTransform,
    modified: data.modified || false,
    modifiedAt: data.modifiedAt,
  };
}

/**
 * Reset modification tracking for an object (after save)
 */
export function resetObjectModification(obj: fabric.Object): void {
  const data = obj.data || {};
  obj.set('data', {
    ...data,
    modified: false,
    modifiedAt: undefined,
    originalTransform: data.ItemTransform, // Current becomes original
  });
}

/**
 * Check if object is locked
 */
export function isObjectLocked(obj: fabric.Object): boolean {
  return obj.data?.locked === true || obj.data?.locked === 'true';
}

/**
 * Lock/unlock an object
 */
export function setObjectLocked(obj: fabric.Object, locked: boolean): void {
  const data = obj.data || {};
  obj.set('data', {
    ...data,
    locked,
  });

  // Update Fabric controls
  enableObjectControls(obj, {
    selectable: !locked,
    hasControls: !locked,
    lockMovementX: locked,
    lockMovementY: locked,
    lockRotation: locked,
    lockScalingX: locked,
    lockScalingY: locked,
  });
}
