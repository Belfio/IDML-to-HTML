import { fabric } from 'fabric';
import type {
  SpreadElement,
  PageElement,
  RectangleElement,
  TextFrameElement,
  GraphicLineElement,
  GroupElement,
  PolygonElement,
} from '../interfaces/spreadInterfaces';
import { IDMLTextFrame, createTextFrameFromIDML } from './textFrame';
import type { StoryData } from '../textEditor/storyParser.server';
import type { IDMLColor } from '../colors/colorManager';
import {
  setupTransformTracking,
  enableObjectControls,
  isObjectLocked,
} from './transformHandler';

/**
 * FabricCanvas: Wrapper for Fabric.js canvas that handles IDML to Fabric conversion
 *
 * Key Responsibilities:
 * - Initialize Fabric.js canvas
 * - Parse ItemTransform matrices (6-value IDML → Fabric transforms)
 * - Convert IDML elements to Fabric objects
 * - Handle coordinate conversion (IDML points × 0.75 = pixels)
 */

export interface FabricCanvasOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  selection?: boolean;
}

export interface Transform {
  scaleX: number;
  scaleY: number;
  angle: number;
  left: number;
  top: number;
  skewX: number;
  skewY: number;
}

/**
 * Main FabricCanvas class
 */
export class FabricCanvas {
  private canvas: fabric.Canvas;
  private pointsToPixelsRatio = 0.75; // IDML points to pixels conversion
  private storiesMap: Map<string, StoryData> = new Map(); // Store loaded stories
  private colorsMap: Map<string, IDMLColor> = new Map(); // Store loaded colors

  constructor(canvasElement: HTMLCanvasElement, options?: FabricCanvasOptions) {
    this.canvas = new fabric.Canvas(canvasElement, {
      width: options?.width || 800,
      height: options?.height || 600,
      backgroundColor: options?.backgroundColor || '#ffffff',
      selection: options?.selection !== undefined ? options.selection : true,
    });

    // Setup transform tracking for drag/resize/rotate operations
    setupTransformTracking(this.canvas, this.pointsToPixelsRatio);
  }

  /**
   * Load stories data for text frames
   */
  setStories(stories: Map<string, StoryData>): void {
    this.storiesMap = stories;
  }

  /**
   * Load colors for rendering
   */
  setColors(colors: IDMLColor[]): void {
    this.colorsMap.clear();
    colors.forEach(color => {
      this.colorsMap.set(color.id, color);
    });
  }

  /**
   * Get RGB color from color ID
   */
  private getColorRGB(colorId?: string): string {
    if (!colorId) return '#cccccc';
    if (colorId === 'Color/Paper') return '#ffffff';
    if (colorId === 'Color/Black') return '#000000';

    const color = this.colorsMap.get(colorId);
    return color?.rgb || '#cccccc';
  }

  /**
   * Get the underlying Fabric.js canvas instance
   */
  getCanvas(): fabric.Canvas {
    return this.canvas;
  }

  /**
   * Clear all objects from the canvas
   */
  clear(): void {
    this.canvas.clear();
  }

  /**
   * Render the canvas
   */
  render(): void {
    this.canvas.renderAll();
  }

  /**
   * Parse ItemTransform string from IDML (6-value matrix) to Fabric transform object
   *
   * IDML ItemTransform format: "a b c d tx ty"
   * Matrix: [a b c d tx ty]
   * - a, d: scale
   * - b, c: skew/rotation
   * - tx, ty: translation (in points)
   *
   * @param transformString - IDML ItemTransform string
   * @returns Transform object with Fabric-compatible values
   */
  parseItemTransform(transformString: string): Transform {
    const values = transformString.split(' ').map(Number);

    if (values.length !== 6) {
      console.warn(`Invalid ItemTransform: ${transformString}, using identity matrix`);
      return {
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        left: 0,
        top: 0,
        skewX: 0,
        skewY: 0,
      };
    }

    const [a, b, c, d, tx, ty] = values;

    // Decompose the matrix
    // scaleX = √(a² + b²)
    const scaleX = Math.sqrt(a * a + b * b);

    // scaleY = √(c² + d²)
    const scaleY = Math.sqrt(c * c + d * d);

    // angle = atan2(b, a) in degrees
    const angle = Math.atan2(b, a) * (180 / Math.PI);

    // Translation: convert points to pixels
    const left = this.convertPointsToPixels(tx);
    const top = this.convertPointsToPixels(ty);

    // Calculate skew (simplified - for complex skews, more work needed)
    const skewX = Math.atan2(c, d) * (180 / Math.PI) - 90 - angle;
    const skewY = 0; // Rarely used in IDML

    return {
      scaleX,
      scaleY,
      angle,
      left,
      top,
      skewX,
      skewY,
    };
  }

  /**
   * Convert IDML points to pixels
   * IDML uses points (72 points = 1 inch)
   * Conversion factor: pixels = points × 0.75
   */
  convertPointsToPixels(points: number): number {
    return points * this.pointsToPixelsRatio;
  }

  /**
   * Convert pixels to IDML points (for export)
   */
  convertPixelsToPoints(pixels: number): number {
    return pixels / this.pointsToPixelsRatio;
  }

  /**
   * Parse GeometricBounds string from IDML
   * Format: "y1 x1 y2 x2" (note the unusual order!)
   *
   * @returns {top, left, width, height} in pixels
   */
  parseGeometricBounds(boundsString: string): {
    top: number;
    left: number;
    width: number;
    height: number;
  } {
    const bounds = boundsString.split(' ').map(Number);

    if (bounds.length !== 4) {
      console.warn(`Invalid GeometricBounds: ${boundsString}`);
      return { top: 0, left: 0, width: 100, height: 100 };
    }

    // IDML format is [y1, x1, y2, x2] - unusual order!
    const [y1, x1, y2, x2] = bounds;

    return {
      top: this.convertPointsToPixels(y1),
      left: this.convertPointsToPixels(x1),
      width: this.convertPointsToPixels(x2 - x1),
      height: this.convertPointsToPixels(y2 - y1),
    };
  }

  /**
   * Load a spread onto the canvas
   */
  async loadSpread(spread: SpreadElement): Promise<void> {
    this.clear();

    // Set canvas background based on spread attributes
    if (spread.$?.ItemTransform) {
      // Parse spread transform if needed
      const spreadTransform = this.parseItemTransform(spread.$.ItemTransform);
      console.log('Spread transform:', spreadTransform);
    }

    // Load direct children of spread
    await this.loadSpreadChildren(spread);

    // Load pages and their children
    if (spread.Page) {
      for (const page of spread.Page) {
        await this.loadPage(page);
      }
    }

    this.render();
  }

  /**
   * Load spread-level children (elements directly on spread, not on pages)
   */
  private async loadSpreadChildren(spread: SpreadElement): Promise<void> {
    // TextFrames
    if (spread.TextFrame) {
      for (const frame of spread.TextFrame) {
        const fabricObj = this.createTextFrame(frame);
        if (fabricObj) this.canvas.add(fabricObj);
      }
    }

    // Rectangles
    if (spread.Rectangle) {
      for (const rect of spread.Rectangle) {
        const fabricObj = this.createRectangle(rect);
        if (fabricObj) this.canvas.add(fabricObj);
      }
    }

    // GraphicLines
    if (spread.GraphicLine) {
      for (const line of spread.GraphicLine) {
        const fabricObj = this.createGraphicLine(line);
        if (fabricObj) this.canvas.add(fabricObj);
      }
    }

    // Groups
    if (spread.Group) {
      for (const group of spread.Group) {
        const fabricObj = await this.createGroup(group);
        if (fabricObj) this.canvas.add(fabricObj);
      }
    }

    // Polygons
    if (spread.Polygon) {
      for (const polygon of spread.Polygon) {
        const fabricObj = this.createPolygon(polygon);
        if (fabricObj) this.canvas.add(fabricObj);
      }
    }
  }

  /**
   * Load a page and its children
   */
  private async loadPage(page: PageElement): Promise<void> {
    const pageAttrs = page.$;

    // Parse page bounds
    const bounds = this.parseGeometricBounds(pageAttrs.GeometricBounds);

    // Create a page background rectangle
    const pageRect = new fabric.Rect({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      fill: 'white',
      stroke: '#cccccc',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      data: {
        idmlType: 'Page',
        idmlId: pageAttrs.Self,
        name: pageAttrs.Name,
      },
    });

    this.canvas.add(pageRect);

    // Load page children
    if (page.TextFrame) {
      for (const frame of page.TextFrame) {
        const fabricObj = this.createTextFrame(frame);
        if (fabricObj) this.canvas.add(fabricObj);
      }
    }

    if (page.Rectangle) {
      for (const rect of page.Rectangle) {
        const fabricObj = this.createRectangle(rect);
        if (fabricObj) this.canvas.add(fabricObj);
      }
    }

    if (page.GraphicLine) {
      for (const line of page.GraphicLine) {
        const fabricObj = this.createGraphicLine(line);
        if (fabricObj) this.canvas.add(fabricObj);
      }
    }
  }

  /**
   * Create a Fabric TextFrame from IDML TextFrame element
   */
  createTextFrame(frame: TextFrameElement): IDMLTextFrame | null {
    const attrs = frame.$;
    const transform = this.parseItemTransform(attrs.ItemTransform);

    // Get story data if available
    const storyData = this.storiesMap.get(attrs.ParentStory);

    // Create TextFrame with story data
    const textFrame = createTextFrameFromIDML(
      {
        Self: attrs.Self,
        ParentStory: attrs.ParentStory,
        ItemTransform: attrs.ItemTransform,
        ContentType: attrs.ContentType,
      },
      transform,
      storyData
    );

    // Enable controls (drag/resize/rotate)
    const locked = attrs.Locked === true;
    enableObjectControls(textFrame, {
      selectable: !locked,
      hasControls: !locked,
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
    });

    return textFrame;
  }

  /**
   * Create a Fabric Rectangle from IDML Rectangle element
   */
  createRectangle(rect: RectangleElement): fabric.Rect | null {
    const attrs = rect.$;
    const transform = this.parseItemTransform(attrs.ItemTransform);

    // Get fill and stroke colors if available
    const fillColor = this.getColorRGB((attrs as any).FillColor);
    const strokeColor = this.getColorRGB((attrs as any).StrokeColor);

    // Create rectangle
    const fabricRect = new fabric.Rect({
      left: transform.left,
      top: transform.top,
      width: 100, // Default size - should be calculated from PathGeometry
      height: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: parseFloat((attrs as any).StrokeWeight || '1'),
      scaleX: transform.scaleX,
      scaleY: transform.scaleY,
      angle: transform.angle,
      data: {
        idmlType: 'Rectangle',
        idmlId: attrs.Self,
        contentType: attrs.ContentType,
        visible: attrs.Visible,
        locked: attrs.Locked,
        layer: attrs.ItemLayer,
        originalTransform: attrs.ItemTransform,
      },
    });

    // Enable controls (drag/resize/rotate)
    const locked = attrs.Locked === true;
    enableObjectControls(fabricRect, {
      selectable: !locked,
      hasControls: !locked,
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
    });

    // TODO: Handle images in Phase 4
    if (rect.Image) {
      console.log('Rectangle has image - will handle in Phase 4');
    }

    return fabricRect;
  }

  /**
   * Create a Fabric Line from IDML GraphicLine element
   */
  createGraphicLine(line: GraphicLineElement): fabric.Line | null {
    const attrs = line.$;
    const transform = this.parseItemTransform(attrs.ItemTransform);

    // Get stroke color
    const strokeColor = this.getColorRGB(attrs.StrokeColor);

    // Create line (default horizontal, will be transformed)
    const fabricLine = new fabric.Line([0, 0, 100, 0], {
      left: transform.left,
      top: transform.top,
      stroke: strokeColor,
      strokeWidth: parseFloat(attrs.StrokeWeight) || 1,
      scaleX: transform.scaleX,
      scaleY: transform.scaleY,
      angle: transform.angle,
      data: {
        idmlType: 'GraphicLine',
        idmlId: attrs.Self,
        strokeColor: attrs.StrokeColor,
        strokeWeight: attrs.StrokeWeight,
        layer: attrs.ItemLayer,
        originalTransform: attrs.ItemTransform,
      },
    });

    // Enable controls (drag/resize/rotate)
    const locked = attrs.Locked === true;
    enableObjectControls(fabricLine, {
      selectable: !locked,
      hasControls: !locked,
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
    });

    return fabricLine;
  }

  /**
   * Create a Fabric Group from IDML Group element
   */
  private async createGroup(group: GroupElement): Promise<fabric.Group | null> {
    const attrs = group.$;
    const transform = this.parseItemTransform(attrs.ItemTransform);
    const objects: fabric.Object[] = [];

    // Add group children
    if (group.Rectangle) {
      for (const rect of group.Rectangle) {
        const fabricObj = this.createRectangle(rect);
        if (fabricObj) objects.push(fabricObj);
      }
    }

    if (group.TextFrame) {
      for (const frame of group.TextFrame) {
        const fabricObj = this.createTextFrame(frame);
        if (fabricObj) objects.push(fabricObj);
      }
    }

    if (group.GraphicLine) {
      for (const line of group.GraphicLine) {
        const fabricObj = this.createGraphicLine(line);
        if (fabricObj) objects.push(fabricObj);
      }
    }

    if (objects.length === 0) {
      return null;
    }

    const fabricGroup = new fabric.Group(objects, {
      left: transform.left,
      top: transform.top,
      scaleX: transform.scaleX,
      scaleY: transform.scaleY,
      angle: transform.angle,
      data: {
        idmlType: 'Group',
        idmlId: attrs.Self,
        visible: attrs.Visible,
        locked: attrs.Locked,
        originalTransform: attrs.ItemTransform,
      },
    });

    // Enable controls (drag/resize/rotate)
    const locked = attrs.Locked === true;
    enableObjectControls(fabricGroup, {
      selectable: !locked,
      hasControls: !locked,
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
    });

    return fabricGroup;
  }

  /**
   * Create a Fabric Polygon from IDML Polygon element
   */
  createPolygon(polygon: PolygonElement): fabric.Polygon | null {
    const attrs = polygon.$;
    const transform = this.parseItemTransform(attrs.ItemTransform);

    // Default triangle points (will be replaced with actual PathGeometry in Phase 3)
    const points = [
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
    ];

    const fabricPolygon = new fabric.Polygon(points, {
      left: transform.left,
      top: transform.top,
      fill: 'rgba(255, 200, 200, 0.3)', // Light red placeholder
      stroke: '#666666',
      strokeWidth: 1,
      scaleX: transform.scaleX,
      scaleY: transform.scaleY,
      angle: transform.angle,
      data: {
        idmlType: 'Polygon',
        idmlId: attrs.Self,
        contentType: attrs.ContentType,
        visible: attrs.Visible,
        locked: attrs.Locked,
        layer: attrs.ItemLayer,
        originalTransform: attrs.ItemTransform,
      },
    });

    // Enable controls (drag/resize/rotate)
    const locked = attrs.Locked === true;
    enableObjectControls(fabricPolygon, {
      selectable: !locked,
      hasControls: !locked,
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
    });

    return fabricPolygon;
  }

  /**
   * Set canvas dimensions
   */
  setDimensions(width: number, height: number): void {
    this.canvas.setDimensions({ width, height });
  }

  /**
   * Export canvas to data URL (for thumbnails, previews)
   */
  toDataURL(format: string = 'png'): string {
    return this.canvas.toDataURL({ format });
  }

  /**
   * Dispose of the canvas and clean up resources
   */
  dispose(): void {
    this.canvas.dispose();
  }
}

/**
 * Factory function to create a FabricCanvas instance
 */
export function createFabricCanvas(
  canvasElement: HTMLCanvasElement,
  options?: FabricCanvasOptions
): FabricCanvas {
  return new FabricCanvas(canvasElement, options);
}
