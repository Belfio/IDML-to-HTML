/**
 * Story Utilities - Pure functions that work on both client and server
 * 
 * These functions don't use Node.js APIs and can be safely imported in browser code
 */

import type { StoryData, CharacterRangeData } from './storyParser.server';

/**
 * Convert story data to plain text
 */
export function storyToPlainText(story: StoryData): string {
  return story.paragraphs
    .map(para =>
      para.characterRanges
        .map(range => range.content)
        .join('')
    )
    .join('\n\n');
}

/**
 * Get text formatting styles from character range
 */
export function getCharacterStyles(range: CharacterRangeData): Record<string, any> {
  const styles: Record<string, any> = {};

  if (range.fontFamily) {
    styles.fontFamily = range.fontFamily;
  }

  if (range.fontSize) {
    styles.fontSize = range.fontSize;
  }

  if (range.fontStyle) {
    // Map IDML font styles to CSS
    const styleMap: Record<string, any> = {
      'Italic': { fontStyle: 'italic' },
      'Bold': { fontWeight: 'bold' },
      'Bold Italic': { fontStyle: 'italic', fontWeight: 'bold' },
    };

    const mapped = styleMap[range.fontStyle];
    if (mapped) {
      Object.assign(styles, mapped);
    }
  }

  if (range.fillColor) {
    styles.fill = range.fillColor;
  }

  return styles;
}

/**
 * Map IDML justification to CSS text-align
 */
export function mapJustification(justification?: string): string {
  if (!justification) return 'left';

  const map: Record<string, string> = {
    'LeftJustified': 'left',
    'CenterJustified': 'center',
    'RightJustified': 'right',
    'FullyJustified': 'justify',
  };

  return map[justification] || 'left';
}
