import { fabric } from 'fabric';
import type { IDMLTextFrame } from '../canvas/textFrame';
import { composeItemTransform } from '../canvas/transformHandler';

/**
 * Fabric to IDML Converter: Convert canvas objects back to IDML elements
 *
 * Key Responsibilities:
 * - Convert Fabric objects to IDML XML structure
 * - Preserve all IDML attributes
 * - Handle transforms (Fabric → IDML matrix)
 * - Maintain element IDs and references
 */

export interface IDMLElement {
  type: 'TextFrame' | 'Rectangle' | 'GraphicLine' | 'Group' | 'Polygon' | 'Oval';
  attributes: Record<string, any>;
  children?: IDMLElement[];
  image?: {
    link: string;
    bounds: string;
  };
}

/**
 * Convert Fabric object to IDML element structure
 */
export function fabricObjectToIDML(obj: fabric.Object): IDMLElement | null {
  const data = obj.data || {};
  const idmlType = data.idmlType;

  if (!idmlType) {
    console.warn('Object missing idmlType:', obj);
    return null;
  }

  // Get transform
  const transform = composeItemTransform(obj);

  // Base attributes
  const baseAttributes: Record<string, any> = {
    Self: data.idmlId || `u${Math.random().toString(16).slice(2, 6)}`,
    ItemTransform: transform,
    Visible: data.visible !== false,
    ItemLayer: data.layer || data.ItemLayer || 'Layer 1',
  };

  // Add Locked if present
  if (data.locked !== undefined) {
    baseAttributes.Locked = data.locked;
  }

  switch (idmlType) {
    case 'TextFrame':
      return convertTextFrame(obj as IDMLTextFrame, baseAttributes);

    case 'Rectangle':
      return convertRectangle(obj as fabric.Rect, baseAttributes);

    case 'GraphicLine':
      return convertGraphicLine(obj as fabric.Line, baseAttributes);

    case 'Group':
      return convertGroup(obj as fabric.Group, baseAttributes);

    case 'Polygon':
      return convertPolygon(obj as fabric.Polygon, baseAttributes);

    case 'Oval':
      return convertOval(obj as fabric.Ellipse, baseAttributes);

    default:
      console.warn(`Unknown IDML type: ${idmlType}`);
      return null;
  }
}

/**
 * Convert TextFrame to IDML
 */
function convertTextFrame(obj: IDMLTextFrame, baseAttributes: Record<string, any>): IDMLElement {
  return {
    type: 'TextFrame',
    attributes: {
      ...baseAttributes,
      ParentStory: obj.parentStory || `Story_${baseAttributes.Self}`,
      ContentType: 'TextType',
      PreviousTextFrame: 'n',
      NextTextFrame: 'n',
    },
  };
}

/**
 * Convert Rectangle to IDML
 */
function convertRectangle(obj: fabric.Rect, baseAttributes: Record<string, any>): IDMLElement {
  const element: IDMLElement = {
    type: 'Rectangle',
    attributes: {
      ...baseAttributes,
      ContentType: obj.data?.contentType || 'GraphicType',
      StoryTitle: obj.data?.StoryTitle || '',
      LocalDisplaySetting: obj.data?.LocalDisplaySetting || 'Default',
      AppliedObjectStyle: obj.data?.AppliedObjectStyle || 'ObjectStyle/$ID/[None]',
      FillColor: obj.data?.FillColor || 'Color/Paper',
      StrokeColor: obj.data?.StrokeColor || 'Color/Black',
      StrokeWeight: obj.data?.StrokeWeight || '1',
    },
  };

  // Add image if present
  if (obj.data?.imageUrl) {
    element.image = {
      link: obj.data.imageUrl,
      bounds: calculateImageBounds(obj),
    };
  }

  return element;
}

/**
 * Convert GraphicLine to IDML
 */
function convertGraphicLine(obj: fabric.Line, baseAttributes: Record<string, any>): IDMLElement {
  return {
    type: 'GraphicLine',
    attributes: {
      ...baseAttributes,
      ContentType: 'Unassigned',
      StrokeColor: obj.data?.strokeColor || obj.data?.StrokeColor || 'Color/Black',
      StrokeWeight: obj.data?.strokeWeight || obj.data?.StrokeWeight || '1',
      LeftLineEnd: obj.data?.LeftLineEnd || 'None',
    },
  };
}

/**
 * Convert Group to IDML
 */
function convertGroup(obj: fabric.Group, baseAttributes: Record<string, any>): IDMLElement {
  const children: IDMLElement[] = [];

  // Convert all children
  obj.getObjects().forEach(child => {
    const childElement = fabricObjectToIDML(child);
    if (childElement) {
      children.push(childElement);
    }
  });

  return {
    type: 'Group',
    attributes: baseAttributes,
    children,
  };
}

/**
 * Convert Polygon to IDML
 */
function convertPolygon(obj: fabric.Polygon, baseAttributes: Record<string, any>): IDMLElement {
  return {
    type: 'Polygon',
    attributes: {
      ...baseAttributes,
      ContentType: obj.data?.contentType || 'GraphicType',
      StoryTitle: obj.data?.StoryTitle || '',
      OverriddenPageItemProps: obj.data?.OverriddenPageItemProps || '',
      Name: obj.data?.Name || '',
      HorizontalLayoutConstraints: obj.data?.HorizontalLayoutConstraints || 'FlexibleDimension FixedDimension FlexibleDimension',
      VerticalLayoutConstraints: obj.data?.VerticalLayoutConstraints || 'FlexibleDimension FixedDimension FlexibleDimension',
      FillColor: obj.data?.FillColor || 'Color/Paper',
      StrokeColor: obj.data?.StrokeColor || 'Color/Black',
      LocalDisplaySetting: obj.data?.LocalDisplaySetting || 'Default',
    },
  };
}

/**
 * Convert Oval/Ellipse to IDML
 */
function convertOval(obj: fabric.Ellipse, baseAttributes: Record<string, any>): IDMLElement {
  return {
    type: 'Oval',
    attributes: {
      ...baseAttributes,
      ContentType: obj.data?.contentType || 'GraphicType',
      StoryTitle: obj.data?.StoryTitle || '',
      FillColor: obj.data?.FillColor || 'Color/Paper',
      StrokeColor: obj.data?.StrokeColor || 'Color/Black',
      LocalDisplaySetting: obj.data?.LocalDisplaySetting || 'Default',
    },
  };
}

/**
 * Calculate image bounds for Rectangle with image
 */
function calculateImageBounds(obj: fabric.Rect): string {
  const width = (obj.width || 100) * (obj.scaleX || 1);
  const height = (obj.height || 100) * (obj.scaleY || 1);

  // IDML format: "y1 x1 y2 x2" (unusual order!)
  return `0 0 ${height} ${width}`;
}

/**
 * Convert all canvas objects to IDML elements
 */
export function canvasToIDMLElements(canvas: fabric.Canvas): IDMLElement[] {
  const elements: IDMLElement[] = [];

  canvas.getObjects().forEach(obj => {
    // Skip page backgrounds and other non-IDML objects
    if (obj.data?.idmlType === 'Page') {
      return;
    }

    const element = fabricObjectToIDML(obj);
    if (element) {
      elements.push(element);
    }
  });

  return elements;
}

/**
 * Group elements by type for spread structure
 */
export function groupElementsByType(elements: IDMLElement[]): Record<string, IDMLElement[]> {
  const grouped: Record<string, IDMLElement[]> = {
    TextFrame: [],
    Rectangle: [],
    GraphicLine: [],
    Group: [],
    Polygon: [],
    Oval: [],
  };

  elements.forEach(element => {
    const type = element.type;
    if (grouped[type]) {
      grouped[type].push(element);
    }
  });

  return grouped;
}

/**
 * Get all modified elements (for incremental saves)
 */
export function getModifiedElements(canvas: fabric.Canvas): IDMLElement[] {
  const elements: IDMLElement[] = [];

  canvas.getObjects().forEach(obj => {
    if (obj.data?.modified === true || obj.data?.isNew === true) {
      const element = fabricObjectToIDML(obj);
      if (element) {
        elements.push(element);
      }
    }
  });

  return elements;
}
