import { fabric } from 'fabric';
import { generateUniqueID, getExistingIds } from './elementFactory';
import { enableObjectControls } from './transformHandler';

/**
 * GroupHandler: Manage group and ungroup operations
 *
 * Key Responsibilities:
 * - Group selected objects into IDML Group
 * - Ungroup existing groups
 * - Maintain IDML data structure
 * - Handle nested groups
 */

/**
 * Group selected objects on canvas
 */
export function groupSelectedObjects(canvas: fabric.Canvas): fabric.Group | null {
  const activeSelection = canvas.getActiveObject();

  // Check if we have multiple selected objects
  if (!activeSelection || activeSelection.type !== 'activeSelection') {
    console.warn('No multiple objects selected to group');
    return null;
  }

  const selection = activeSelection as fabric.ActiveSelection;
  const objects = selection.getObjects();

  if (objects.length < 2) {
    console.warn('Need at least 2 objects to create a group');
    return null;
  }

  // Generate unique ID for group
  const existingIds = getExistingIds(canvas);
  const groupId = generateUniqueID(existingIds);

  // Create group from selection
  const group = new fabric.Group(objects, {
    left: selection.left,
    top: selection.top,
    angle: selection.angle || 0,
  });

  // Set IDML data
  group.set('data', {
    idmlType: 'Group',
    idmlId: groupId,
    visible: true,
    locked: false,
    layer: 'Layer 1',
    isNew: true,
    created: Date.now(),
  });

  // Enable controls
  enableObjectControls(group);

  // Remove original objects and add group
  objects.forEach(obj => canvas.remove(obj));
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.renderAll();

  console.log(`Created group ${groupId} with ${objects.length} objects`);

  return group;
}

/**
 * Ungroup selected group
 */
export function ungroupSelectedGroup(canvas: fabric.Canvas): fabric.Object[] | null {
  const activeObject = canvas.getActiveObject();

  // Check if selected object is a group
  if (!activeObject || activeObject.type !== 'group') {
    console.warn('Selected object is not a group');
    return null;
  }

  const group = activeObject as fabric.Group;
  const objects = group.getObjects();

  if (objects.length === 0) {
    console.warn('Group is empty');
    return null;
  }

  // Get group transform
  const groupLeft = group.left || 0;
  const groupTop = group.top || 0;
  const groupAngle = group.angle || 0;
  const groupScaleX = group.scaleX || 1;
  const groupScaleY = group.scaleY || 1;

  // Ungroup: add each object back to canvas with transformed coordinates
  const ungroupedObjects: fabric.Object[] = [];

  objects.forEach(obj => {
    // Calculate object's absolute position
    const objLeft = obj.left || 0;
    const objTop = obj.top || 0;

    // Apply group transform to object position
    const cos = Math.cos((groupAngle * Math.PI) / 180);
    const sin = Math.sin((groupAngle * Math.PI) / 180);

    const rotatedX = objLeft * cos - objTop * sin;
    const rotatedY = objLeft * sin + objTop * cos;

    // Set absolute position
    obj.set({
      left: groupLeft + rotatedX * groupScaleX,
      top: groupTop + rotatedY * groupScaleY,
      angle: (obj.angle || 0) + groupAngle,
      scaleX: (obj.scaleX || 1) * groupScaleX,
      scaleY: (obj.scaleY || 1) * groupScaleY,
    });

    // Re-enable controls if they were disabled
    enableObjectControls(obj);

    canvas.add(obj);
    ungroupedObjects.push(obj);
  });

  // Remove the group
  canvas.remove(group);

  // Select all ungrouped objects
  if (ungroupedObjects.length > 0) {
    const selection = new fabric.ActiveSelection(ungroupedObjects, { canvas });
    canvas.setActiveObject(selection);
  }

  canvas.renderAll();

  console.log(`Ungrouped ${ungroupedObjects.length} objects from group`);

  return ungroupedObjects;
}

/**
 * Check if selected object is a group
 */
export function isGroupSelected(canvas: fabric.Canvas): boolean {
  const activeObject = canvas.getActiveObject();
  return activeObject !== null && activeObject !== undefined && activeObject.type === 'group';
}

/**
 * Check if multiple objects are selected
 */
export function hasMultipleSelection(canvas: fabric.Canvas): boolean {
  const activeObject = canvas.getActiveObject();
  return activeObject !== null && activeObject !== undefined && activeObject.type === 'activeSelection';
}

/**
 * Get all objects in a group (including nested)
 */
export function getAllGroupObjects(group: fabric.Group): fabric.Object[] {
  const objects: fabric.Object[] = [];

  const traverse = (obj: fabric.Object) => {
    if (obj.type === 'group') {
      const g = obj as fabric.Group;
      g.getObjects().forEach(traverse);
    } else {
      objects.push(obj);
    }
  };

  group.getObjects().forEach(traverse);

  return objects;
}

/**
 * Get group depth (nesting level)
 */
export function getGroupDepth(obj: fabric.Object): number {
  if (obj.type !== 'group') {
    return 0;
  }

  const group = obj as fabric.Group;
  const objects = group.getObjects();

  if (objects.length === 0) {
    return 1;
  }

  const childDepths = objects.map(getGroupDepth);
  return 1 + Math.max(...childDepths);
}
