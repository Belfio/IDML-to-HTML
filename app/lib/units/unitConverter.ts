/**
 * Unit Converter: Convert between different measurement units
 *
 * IDML uses points as the base unit (72 points = 1 inch)
 *
 * Supported units:
 * - Points (pt) - Base unit
 * - Picas (pc) - 1 pica = 12 points
 * - Inches (in) - 1 inch = 72 points
 * - Millimeters (mm) - 1 mm = 2.834645669 points
 * - Centimeters (cm) - 1 cm = 28.34645669 points
 * - Pixels (px) - For canvas rendering (1 point = 0.75 pixels at 96 DPI)
 */

export type Unit = 'pt' | 'pc' | 'in' | 'mm' | 'cm' | 'px';

// Conversion factors to points
const TO_POINTS: Record<Unit, number> = {
  pt: 1,
  pc: 12,
  in: 72,
  mm: 2.834645669291339,
  cm: 28.34645669291339,
  px: 1 / 0.75, // Pixels to points (at 96 DPI)
};

/**
 * Convert from any unit to points
 */
export function toPoints(value: number, fromUnit: Unit): number {
  return value * TO_POINTS[fromUnit];
}

/**
 * Convert from points to any unit
 */
export function fromPoints(points: number, toUnit: Unit): number {
  return points / TO_POINTS[toUnit];
}

/**
 * Convert between any two units
 */
export function convert(value: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) return value;

  const points = toPoints(value, fromUnit);
  return fromPoints(points, toUnit);
}

/**
 * Format a value with unit suffix
 */
export function formatValue(value: number, unit: Unit, decimals: number = 2): string {
  return `${value.toFixed(decimals)}${unit}`;
}

/**
 * Parse a value with unit suffix (e.g., "10.5in", "100pt")
 */
export function parseValue(valueString: string): { value: number; unit: Unit } | null {
  const match = valueString.match(/^(-?[\d.]+)\s*(pt|pc|in|mm|cm|px)?$/i);

  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  const unit = (match[2]?.toLowerCase() as Unit) || 'pt';

  return { value, unit };
}

/**
 * Round to nearest increment (for snap-to-grid)
 */
export function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

/**
 * Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number, unit: Unit = 'pt'): number {
  const pointsValue = toPoints(value, unit);
  const gridPoints = toPoints(gridSize, unit);
  const snapped = roundToIncrement(pointsValue, gridPoints);
  return fromPoints(snapped, unit);
}

/**
 * Get display name for unit
 */
export function getUnitName(unit: Unit): string {
  const names: Record<Unit, string> = {
    pt: 'Points',
    pc: 'Picas',
    in: 'Inches',
    mm: 'Millimeters',
    cm: 'Centimeters',
    px: 'Pixels',
  };

  return names[unit];
}

/**
 * Get unit symbol
 */
export function getUnitSymbol(unit: Unit): string {
  return unit;
}

/**
 * Common measurement presets
 */
export const PRESETS = {
  // Standard document sizes in points (width x height)
  'US Letter': { width: 612, height: 792 }, // 8.5 x 11 in
  'US Legal': { width: 612, height: 1008 }, // 8.5 x 14 in
  'A4': { width: 595.276, height: 841.89 }, // 210 x 297 mm
  'A3': { width: 841.89, height: 1190.551 }, // 297 x 420 mm
  'Tabloid': { width: 792, height: 1224 }, // 11 x 17 in
};

/**
 * Convert IDML transform matrix values (in points) to pixels
 */
export function transformToPixels(transform: string): string {
  const values = transform.split(' ').map(Number);

  if (values.length !== 6) {
    return transform;
  }

  // Values [0-3] are scale/rotation (unitless)
  // Values [4-5] are translation (in points)
  const [a, b, c, d, tx, ty] = values;

  const txPx = fromPoints(tx, 'px');
  const tyPx = fromPoints(ty, 'px');

  return `${a} ${b} ${c} ${d} ${txPx} ${tyPx}`;
}

/**
 * Convert pixels transform matrix to points (for IDML export)
 */
export function transformToPoints(transform: string): string {
  const values = transform.split(' ').map(Number);

  if (values.length !== 6) {
    return transform;
  }

  const [a, b, c, d, tx, ty] = values;

  const txPt = toPoints(tx, 'px');
  const tyPt = toPoints(ty, 'px');

  return `${a} ${b} ${c} ${d} ${txPt} ${tyPt}`;
}

/**
 * Validate unit string
 */
export function isValidUnit(unit: string): unit is Unit {
  return ['pt', 'pc', 'in', 'mm', 'cm', 'px'].includes(unit);
}

/**
 * Get all available units
 */
export function getAllUnits(): Unit[] {
  return ['pt', 'pc', 'in', 'mm', 'cm', 'px'];
}
