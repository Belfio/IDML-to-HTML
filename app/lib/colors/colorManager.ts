import * as xml2js from 'xml2js';
import { readFile } from 'fs/promises';

/**
 * Color Manager - Parse and manage IDML colors
 *
 * Key Responsibilities:
 * - Parse Resources/Graphic.xml
 * - Store color definitions
 * - Convert CMYK to RGB
 * - Provide color lookup by ID
 */

export interface IDMLColor {
  id: string;
  name: string;
  model: 'Process' | 'Spot' | 'Registration';
  space: 'CMYK' | 'RGB' | 'LAB';
  colorValue: number[];
  rgb?: string; // Hex color
  visible: boolean;
  editable: boolean;
}

export class ColorManager {
  private colors: Map<string, IDMLColor> = new Map();

  /**
   * Parse Graphic.xml and load colors
   */
  async loadFromGraphicXML(filePath: string): Promise<void> {
    const parser = new xml2js.Parser();

    try {
      const xmlData = await readFile(filePath, 'utf-8');
      const result = await parser.parseStringPromise(xmlData);

      const graphic = result['idPkg:Graphic'];

      if (graphic.Color) {
        for (const colorDef of graphic.Color) {
          const attrs = colorDef.$;

          const colorValue = attrs.ColorValue
            ? attrs.ColorValue.split(' ').map((v: string) => parseFloat(v))
            : [];

          const color: IDMLColor = {
            id: attrs.Self,
            name: attrs.Name || attrs.Self,
            model: attrs.Model as 'Process' | 'Spot' | 'Registration',
            space: attrs.Space as 'CMYK' | 'RGB' | 'LAB',
            colorValue,
            visible: attrs.Visible === 'true',
            editable: attrs.ColorEditable === 'true',
          };

          // Convert to RGB
          if (color.space === 'CMYK') {
            color.rgb = cmykToRgbHex(colorValue);
          } else if (color.space === 'RGB') {
            color.rgb = rgbArrayToHex(colorValue);
          } else {
            // LAB or other spaces - default to black
            color.rgb = '#000000';
          }

          this.colors.set(color.id, color);
        }
      }

      console.log(`Loaded ${this.colors.size} colors from Graphic.xml`);
    } catch (error) {
      console.error('Failed to parse Graphic.xml:', error);
      throw error;
    }
  }

  /**
   * Get color by ID
   */
  getColor(colorId: string): IDMLColor | undefined {
    return this.colors.get(colorId);
  }

  /**
   * Get RGB hex string for a color ID
   */
  getColorRGB(colorId: string): string {
    const color = this.colors.get(colorId);
    return color?.rgb || '#000000';
  }

  /**
   * Get all colors
   */
  getAllColors(): IDMLColor[] {
    return Array.from(this.colors.values());
  }

  /**
   * Get visible colors (for color picker UI)
   */
  getVisibleColors(): IDMLColor[] {
    return Array.from(this.colors.values()).filter(c => c.visible);
  }
}

/**
 * Convert CMYK to RGB
 *
 * CMYK values are 0-100 percentages
 * RGB values are 0-255
 *
 * Formula (simple, not color-managed):
 * R = 255 × (1 - C/100) × (1 - K/100)
 * G = 255 × (1 - M/100) × (1 - K/100)
 * B = 255 × (1 - Y/100) × (1 - K/100)
 */
export function cmykToRgb(c: number, m: number, y: number, k: number): [number, number, number] {
  const r = Math.round(255 * (1 - c / 100) * (1 - k / 100));
  const g = Math.round(255 * (1 - m / 100) * (1 - k / 100));
  const b = Math.round(255 * (1 - y / 100) * (1 - k / 100));

  return [r, g, b];
}

/**
 * Convert CMYK array to RGB hex string
 */
export function cmykToRgbHex(cmyk: number[]): string {
  if (cmyk.length !== 4) {
    console.warn('Invalid CMYK array:', cmyk);
    return '#000000';
  }

  const [c, m, y, k] = cmyk;
  const [r, g, b] = cmykToRgb(c, m, y, k);

  return rgbToHex(r, g, b);
}

/**
 * Convert RGB array to hex string
 */
export function rgbArrayToHex(rgb: number[]): string {
  if (rgb.length !== 3) {
    console.warn('Invalid RGB array:', rgb);
    return '#000000';
  }

  const [r, g, b] = rgb;
  return rgbToHex(r, g, b);
}

/**
 * Convert RGB values to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Create a global color manager instance
 */
let globalColorManager: ColorManager | null = null;

export function getGlobalColorManager(): ColorManager {
  if (!globalColorManager) {
    globalColorManager = new ColorManager();
  }
  return globalColorManager;
}

export function setGlobalColorManager(manager: ColorManager): void {
  globalColorManager = manager;
}
