import * as xml2js from 'xml2js';
import { readFile } from 'fs/promises';

/**
 * Enhanced Story Parser - Returns structured data instead of HTML
 *
 * Parses Story XML files into a structured format suitable for:
 * - Text editing with Fabric IText
 * - Style management
 * - Round-trip serialization back to IDML
 */

export interface StoryData {
  id: string;
  attributes: StoryAttributes;
  preference: StoryPreference;
  paragraphs: ParagraphData[];
}

export interface StoryAttributes {
  Self: string;
  UserText: boolean;
  IsEndnoteStory: boolean;
  AppliedTOCStyle: string;
  TrackChanges: boolean;
  StoryTitle: string;
  AppliedNamedGrid?: string;
}

export interface StoryPreference {
  OpticalMarginAlignment: boolean;
  OpticalMarginSize: number;
  FrameType: string;
  StoryOrientation: string;
  StoryDirection: string;
}

export interface ParagraphData {
  appliedParagraphStyle: string;
  spaceBefore?: number;
  spaceAfter?: number;
  justification?: string;
  characterRanges: CharacterRangeData[];
}

export interface CharacterRangeData {
  appliedCharacterStyle: string;
  fillColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  content: string;
  properties?: Record<string, any>;
  // Additional IDML properties for preservation
  gradientFillAngle?: number;
  gradientFillLength?: number;
  gradientFillStart?: string;
  characterDirection?: string;
}

interface StoryXML {
  'idPkg:Story': {
    Story: [{
      $: StoryAttributes;
      StoryPreference?: [{ $: StoryPreference }];
      InCopyExportOption?: any[];
      ParagraphStyleRange?: ParagraphStyleRangeXML[];
    }];
  };
}

interface ParagraphStyleRangeXML {
  $: {
    AppliedParagraphStyle: string;
    SpaceBefore?: string;
    SpaceAfter?: string;
    Justification?: string;
  };
  CharacterStyleRange?: CharacterStyleRangeXML[];
}

interface CharacterStyleRangeXML {
  $: {
    AppliedCharacterStyle: string;
    FillColor?: string;
    PointSize?: string;
    FontStyle?: string;
    CharacterDirection?: string;
    GradientFillAngle?: string;
    GradientFillLength?: string;
    GradientFillStart?: string;
    [key: string]: any; // Preserve all other attributes
  };
  Properties?: [{
    AppliedFont?: [{ _?: string; $?: { type: string } }];
    [key: string]: any;
  }];
  Content?: string[];
  Br?: any[];
}

/**
 * Parse Story XML file into structured data
 */
export async function parseStoryXML(filePath: string): Promise<StoryData> {
  const parser = new xml2js.Parser();

  try {
    const xmlData = await readFile(filePath, 'utf-8');
    const result: StoryXML = await parser.parseStringPromise(xmlData);

    const story = result['idPkg:Story'].Story[0];
    const storyAttrs = story.$;

    // Parse story preference
    const preference: StoryPreference = story.StoryPreference?.[0]?.$ || {
      OpticalMarginAlignment: false,
      OpticalMarginSize: 12,
      FrameType: 'TextFrameType',
      StoryOrientation: 'Horizontal',
      StoryDirection: 'LeftToRightDirection',
    };

    // Parse paragraphs
    const paragraphs: ParagraphData[] = [];

    if (story.ParagraphStyleRange) {
      for (const paraRange of story.ParagraphStyleRange) {
        const paraAttrs = paraRange.$;

        const characterRanges: CharacterRangeData[] = [];

        if (paraRange.CharacterStyleRange) {
          for (const charRange of paraRange.CharacterStyleRange) {
            const charAttrs = charRange.$;

            // Extract font family
            const fontFamily = charRange.Properties?.[0]?.AppliedFont?.[0]?._ ||
                              charRange.Properties?.[0]?.AppliedFont?.[0];

            // Extract content
            let content = '';
            if (charRange.Content) {
              content = charRange.Content.join('');
            }
            if (charRange.Br) {
              content += '\n';
            }

            characterRanges.push({
              appliedCharacterStyle: charAttrs.AppliedCharacterStyle,
              fillColor: charAttrs.FillColor,
              fontSize: charAttrs.PointSize ? parseFloat(charAttrs.PointSize) : undefined,
              fontFamily: typeof fontFamily === 'string' ? fontFamily : undefined,
              fontStyle: charAttrs.FontStyle,
              content,
              characterDirection: charAttrs.CharacterDirection,
              gradientFillAngle: charAttrs.GradientFillAngle ? parseFloat(charAttrs.GradientFillAngle) : undefined,
              gradientFillLength: charAttrs.GradientFillLength ? parseFloat(charAttrs.GradientFillLength) : undefined,
              gradientFillStart: charAttrs.GradientFillStart,
              // Preserve all other attributes
              properties: { ...charAttrs },
            });
          }
        }

        paragraphs.push({
          appliedParagraphStyle: paraAttrs.AppliedParagraphStyle,
          spaceBefore: paraAttrs.SpaceBefore ? parseFloat(paraAttrs.SpaceBefore) : undefined,
          spaceAfter: paraAttrs.SpaceAfter ? parseFloat(paraAttrs.SpaceAfter) : undefined,
          justification: paraAttrs.Justification,
          characterRanges,
        });
      }
    }

    return {
      id: storyAttrs.Self,
      attributes: storyAttrs,
      preference,
      paragraphs,
    };
  } catch (error) {
    console.error(`Failed to parse story XML: ${filePath}`, error);
    throw error;
  }
}

/**
 * Convert StoryData to plain text (for initial display in text frames)
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
      'BoldItalic': { fontStyle: 'italic', fontWeight: 'bold' },
    };
    Object.assign(styles, styleMap[range.fontStyle] || {});
  }

  if (range.fillColor) {
    styles.fill = mapColor(range.fillColor);
  }

  return styles;
}

/**
 * Map IDML justification to Fabric.js textAlign
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

/**
 * Map IDML color references to hex colors
 * TODO: This will be enhanced in Phase 3 with proper color management
 */
function mapColor(colorRef: string): string {
  if (colorRef === 'Color/Paper') return '#ffffff';
  if (colorRef === 'Color/Black') return '#000000';

  // Extract color ID and use placeholder for now
  // Will be replaced with actual color lookup in Phase 3
  return '#000000';
}

/**
 * Parse multiple stories for a document
 */
export async function parseAllStories(storiesDir: string, storyIds: string[]): Promise<Map<string, StoryData>> {
  const stories = new Map<string, StoryData>();

  for (const storyId of storyIds) {
    try {
      const filePath = `${storiesDir}/Story_${storyId}.xml`;
      const storyData = await parseStoryXML(filePath);
      stories.set(storyId, storyData);
    } catch (error) {
      console.warn(`Failed to parse story ${storyId}:`, error);
    }
  }

  return stories;
}
