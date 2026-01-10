import { fabric } from 'fabric';
import { IDMLTextFrame } from './textFrame';
import { enableObjectControls } from './transformHandler';

/**
 * ElementFactory: Create new IDML elements on canvas
 *
 * Key Responsibilities:
 * - Generate unique IDML IDs
 * - Create new TextFrames, Rectangles, Lines
 * - Set default properties
 * - Enable controls for new objects
 */

/**
 * Generate a unique IDML ID
 * Format: 'u' + 3-4 hex digits
 * Example: u1a2, u3f4b
 */
export function generateUniqueID(existingIds: Set<string>): string {
  let id: string;
  let attempts = 0;
  const maxAttempts = 10000;

  do {
    // Generate random hex between 0x100 and 0xffff (3-4 digits)
    const hex = Math.floor(Math.random() * (0xffff - 0x100) + 0x100).toString(16);
    id = `u${hex}`;
    attempts++;

    if (attempts > maxAttempts) {
      throw new Error('Failed to generate unique ID after maximum attempts');
    }
  } while (existingIds.has(id));

  return id;
}

/**
 * Get all existing IDs from canvas objects
 */
export function getExistingIds(canvas: fabric.Canvas): Set<string> {
  const ids = new Set<string>();

  canvas.getObjects().forEach(obj => {
    if (obj.data?.idmlId) {
      ids.add(obj.data.idmlId);
    }
  });

  return ids;
}

/**
 * Create a new TextFrame on canvas
 */
export function createNewTextFrame(
  canvas: fabric.Canvas,
  options: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    text?: string;
    fontSize?: number;
    fill?: string;
  } = {}
): IDMLTextFrame {
  const existingIds = getExistingIds(canvas);
  const id = generateUniqueID(existingIds);

  // Default position: center of canvas
  const left = options.left ?? canvas.getWidth() / 2 - 100;
  const top = options.top ?? canvas.getHeight() / 2 - 50;

  // Create text frame
  const textFrame = new IDMLTextFrame(options.text || 'New Text', {
    left,
    top,
    width: options.width || 200,
    fontSize: options.fontSize || 16,
    fill: options.fill || '#000000',
    fontFamily: 'Arial',
    editable: true,
    selectable: true,
    hasControls: true,
    hasBorders: true,
  });

  // Set IDML data
  textFrame.set('data', {
    idmlType: 'TextFrame',
    idmlId: id,
    contentType: 'TextType',
    visible: true,
    locked: false,
    layer: 'Layer 1',
    isNew: true,
    created: Date.now(),
  });

  // Set IDML-specific properties
  textFrame.idmlId = id;
  textFrame.parentStory = `Story_${id}`; // Will need to create story on save

  // Enable controls
  enableObjectControls(textFrame);

  return textFrame;
}

/**
 * Create a new Rectangle on canvas
 */
export function createNewRectangle(
  canvas: fabric.Canvas,
  options: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  } = {}
): fabric.Rect {
  const existingIds = getExistingIds(canvas);
  const id = generateUniqueID(existingIds);

  // Default position: center of canvas
  const left = options.left ?? canvas.getWidth() / 2 - 75;
  const top = options.top ?? canvas.getHeight() / 2 - 75;

  // Create rectangle
  const rect = new fabric.Rect({
    left,
    top,
    width: options.width || 150,
    height: options.height || 150,
    fill: options.fill || '#cccccc',
    stroke: options.stroke || '#666666',
    strokeWidth: options.strokeWidth || 1,
    selectable: true,
    hasControls: true,
    hasBorders: true,
  });

  // Set IDML data
  rect.set('data', {
    idmlType: 'Rectangle',
    idmlId: id,
    contentType: 'GraphicType',
    visible: true,
    locked: false,
    layer: 'Layer 1',
    isNew: true,
    created: Date.now(),
  });

  // Enable controls
  enableObjectControls(rect);

  return rect;
}

/**
 * Create a new Line on canvas
 */
export function createNewLine(
  canvas: fabric.Canvas,
  options: {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    stroke?: string;
    strokeWidth?: number;
  } = {}
): fabric.Line {
  const existingIds = getExistingIds(canvas);
  const id = generateUniqueID(existingIds);

  // Default position: horizontal line in center
  const centerX = canvas.getWidth() / 2;
  const centerY = canvas.getHeight() / 2;
  const x1 = options.x1 ?? centerX - 100;
  const y1 = options.y1 ?? centerY;
  const x2 = options.x2 ?? centerX + 100;
  const y2 = options.y2 ?? centerY;

  // Create line
  const line = new fabric.Line([x1, y1, x2, y2], {
    stroke: options.stroke || '#000000',
    strokeWidth: options.strokeWidth || 2,
    selectable: true,
    hasControls: true,
    hasBorders: true,
  });

  // Set IDML data
  line.set('data', {
    idmlType: 'GraphicLine',
    idmlId: id,
    strokeColor: 'Color/Black',
    strokeWeight: (options.strokeWidth || 2).toString(),
    layer: 'Layer 1',
    visible: true,
    locked: false,
    isNew: true,
    created: Date.now(),
  });

  // Enable controls
  enableObjectControls(line);

  return line;
}

/**
 * Create a new Ellipse/Circle on canvas
 */
export function createNewEllipse(
  canvas: fabric.Canvas,
  options: {
    left?: number;
    top?: number;
    rx?: number;
    ry?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  } = {}
): fabric.Ellipse {
  const existingIds = getExistingIds(canvas);
  const id = generateUniqueID(existingIds);

  // Default position: center of canvas
  const left = options.left ?? canvas.getWidth() / 2;
  const top = options.top ?? canvas.getHeight() / 2;

  // Create ellipse
  const ellipse = new fabric.Ellipse({
    left,
    top,
    rx: options.rx || 75,
    ry: options.ry || 75,
    fill: options.fill || '#cccccc',
    stroke: options.stroke || '#666666',
    strokeWidth: options.strokeWidth || 1,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    originX: 'center',
    originY: 'center',
  });

  // Set IDML data
  ellipse.set('data', {
    idmlType: 'Oval', // IDML uses 'Oval' for ellipses
    idmlId: id,
    contentType: 'GraphicType',
    visible: true,
    locked: false,
    layer: 'Layer 1',
    isNew: true,
    created: Date.now(),
  });

  // Enable controls
  enableObjectControls(ellipse);

  return ellipse;
}

/**
 * Add a new element to canvas and mark as modified
 */
export function addElementToCanvas(
  canvas: fabric.Canvas,
  element: fabric.Object
): void {
  canvas.add(element);
  canvas.setActiveObject(element);
  canvas.renderAll();

  console.log(`Added new ${element.data?.idmlType} with ID ${element.data?.idmlId} to canvas`);
}

/**
 * Get factory for creating elements by type
 */
export function getElementFactory(type: string) {
  const factories = {
    textframe: createNewTextFrame,
    rectangle: createNewRectangle,
    line: createNewLine,
    ellipse: createNewEllipse,
  };

  return factories[type.toLowerCase() as keyof typeof factories];
}
