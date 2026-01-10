import { fabric } from 'fabric';
import type { IDMLTextFrame } from '../canvas/textFrame';
import { fromPoints } from '../units/unitConverter';

/**
 * HTML Generator: Export canvas to HTML+CSS
 *
 * Key Responsibilities:
 * - Generate semantic HTML
 * - Create CSS with absolute positioning
 * - Handle text formatting
 * - Include images
 * - Package fonts
 */

export interface HTMLExportOptions {
  includeStyles?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  backgroundColor?: string;
  title?: string;
}

/**
 * Generate HTML from canvas
 */
export function canvasToHTML(
  canvas: fabric.Canvas,
  options: HTMLExportOptions = {}
): { html: string; css: string } {
  const {
    includeStyles = true,
    containerWidth = canvas.getWidth(),
    containerHeight = canvas.getHeight(),
    backgroundColor = '#ffffff',
    title = 'IDML Document',
  } = options;

  const objects = canvas.getObjects();
  const htmlElements: string[] = [];
  const cssRules: string[] = [];

  // Add container styles
  cssRules.push(`
.idml-container {
  position: relative;
  width: ${containerWidth}px;
  height: ${containerHeight}px;
  background-color: ${backgroundColor};
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.idml-element {
  position: absolute;
  box-sizing: border-box;
}
`);

  // Convert each object
  objects.forEach((obj, index) => {
    if (obj.data?.idmlType === 'Page') {
      return; // Skip page backgrounds
    }

    const elementId = `element-${index}`;
    const { html, css } = objectToHTML(obj, elementId);

    if (html) {
      htmlElements.push(html);
    }
    if (css) {
      cssRules.push(css);
    }
  });

  // Build HTML
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title)}</title>
  ${includeStyles ? `<style>${cssRules.join('\n')}</style>` : '<link rel="stylesheet" href="styles.css">'}
</head>
<body>
  <div class="idml-container">
${htmlElements.join('\n')}
  </div>
</body>
</html>
`.trim();

  return {
    html: htmlContent,
    css: cssRules.join('\n'),
  };
}

/**
 * Convert Fabric object to HTML element
 */
function objectToHTML(obj: fabric.Object, id: string): { html: string; css: string } {
  const type = obj.data?.idmlType;

  switch (type) {
    case 'TextFrame':
      return textFrameToHTML(obj as IDMLTextFrame, id);
    case 'Rectangle':
      return rectangleToHTML(obj as fabric.Rect, id);
    case 'GraphicLine':
      return lineToHTML(obj as fabric.Line, id);
    case 'Group':
      return groupToHTML(obj as fabric.Group, id);
    default:
      return { html: '', css: '' };
  }
}

/**
 * Convert TextFrame to HTML
 */
function textFrameToHTML(obj: IDMLTextFrame, id: string): { html: string; css: string } {
  const left = obj.left || 0;
  const top = obj.top || 0;
  const width = (obj.width || 100) * (obj.scaleX || 1);
  const height = (obj.height || 50) * (obj.scaleY || 1);
  const angle = obj.angle || 0;

  const text = obj.text || '';
  const fontSize = obj.fontSize || 16;
  const fontFamily = obj.fontFamily || 'Arial';
  const color = obj.fill || '#000000';
  const textAlign = obj.textAlign || 'left';

  const html = `    <div id="${id}" class="idml-element idml-text">
      ${escapeHTML(text).replace(/\n/g, '<br>')}
    </div>`;

  const css = `
#${id} {
  left: ${left}px;
  top: ${top}px;
  width: ${width}px;
  height: ${height}px;
  font-size: ${fontSize}px;
  font-family: ${fontFamily};
  color: ${color};
  text-align: ${textAlign};
  transform: rotate(${angle}deg);
  overflow: hidden;
  line-height: 1.4;
}`;

  return { html, css };
}

/**
 * Convert Rectangle to HTML
 */
function rectangleToHTML(obj: fabric.Rect, id: string): { html: string; css: string } {
  const left = obj.left || 0;
  const top = obj.top || 0;
  const width = (obj.width || 100) * (obj.scaleX || 1);
  const height = (obj.height || 100) * (obj.scaleY || 1);
  const angle = obj.angle || 0;

  const fill = obj.fill || '#cccccc';
  const stroke = obj.stroke || 'transparent';
  const strokeWidth = obj.strokeWidth || 0;

  const html = `    <div id="${id}" class="idml-element idml-rectangle"></div>`;

  const css = `
#${id} {
  left: ${left}px;
  top: ${top}px;
  width: ${width}px;
  height: ${height}px;
  background-color: ${fill};
  border: ${strokeWidth}px solid ${stroke};
  transform: rotate(${angle}deg);
}`;

  return { html, css };
}

/**
 * Convert Line to HTML
 */
function lineToHTML(obj: fabric.Line, id: string): { html: string; css: string } {
  const left = obj.left || 0;
  const top = obj.top || 0;
  const width = (obj.width || 100) * (obj.scaleX || 1);
  const angle = obj.angle || 0;

  const stroke = obj.stroke || '#000000';
  const strokeWidth = obj.strokeWidth || 1;

  const html = `    <div id="${id}" class="idml-element idml-line"></div>`;

  const css = `
#${id} {
  left: ${left}px;
  top: ${top}px;
  width: ${width}px;
  height: ${strokeWidth}px;
  background-color: ${stroke};
  transform: rotate(${angle}deg);
}`;

  return { html, css };
}

/**
 * Convert Group to HTML
 */
function groupToHTML(obj: fabric.Group, id: string): { html: string; css: string } {
  const left = obj.left || 0;
  const top = obj.top || 0;
  const width = obj.width || 100;
  const height = obj.height || 100;
  const angle = obj.angle || 0;

  const childrenHTML: string[] = [];
  const childrenCSS: string[] = [];

  obj.getObjects().forEach((child, index) => {
    const childId = `${id}-child-${index}`;
    const { html, css } = objectToHTML(child, childId);
    if (html) childrenHTML.push(html);
    if (css) childrenCSS.push(css);
  });

  const html = `    <div id="${id}" class="idml-element idml-group">
${childrenHTML.join('\n')}
    </div>`;

  const css = `
#${id} {
  left: ${left}px;
  top: ${top}px;
  width: ${width}px;
  height: ${height}px;
  transform: rotate(${angle}deg);
}
${childrenCSS.join('\n')}`;

  return { html, css };
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const div = { textContent: text };
  const temp = document.createElement('div');
  temp.textContent = div.textContent;
  return temp.innerHTML;
}

/**
 * Generate standalone CSS file
 */
export function generateCSSFile(css: string): string {
  return `/* IDML Export - Generated CSS */

${css}

/* Responsive container */
@media (max-width: 768px) {
  .idml-container {
    transform: scale(0.5);
    transform-origin: top left;
  }
}
`;
}

/**
 * Generate package metadata
 */
export function generatePackageInfo(canvas: fabric.Canvas): {
  objectCount: number;
  layers: string[];
  dimensions: { width: number; height: number };
} {
  const objects = canvas.getObjects();
  const layers = new Set<string>();

  objects.forEach(obj => {
    const layer = obj.data?.layer || obj.data?.ItemLayer || 'Layer 1';
    layers.add(layer);
  });

  return {
    objectCount: objects.length,
    layers: Array.from(layers),
    dimensions: {
      width: canvas.getWidth(),
      height: canvas.getHeight(),
    },
  };
}
