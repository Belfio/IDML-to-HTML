import * as xml2js from 'xml2js';
import type { StoryData, ParagraphData, CharacterRangeData } from './storyParser.server';

/**
 * Story Serializer - Converts edited text back to Story XML
 *
 * Key Responsibilities:
 * - Convert text edits back to Story XML format
 * - Preserve IDML structure and attributes
 * - Handle character and paragraph style ranges
 * - Maintain XML formatting for valid IDML
 */

/**
 * Serialize StoryData back to XML string
 */
export function serializeStoryToXML(story: StoryData): string {
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8', standalone: true },
    renderOpts: { pretty: true, indent: '\t' },
    headless: false,
  });

  // Build Story object structure
  const storyObj = {
    'idPkg:Story': {
      $: {
        'xmlns:idPkg': 'http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging',
        DOMVersion: '17.0',
      },
      Story: [{
        $: story.attributes,
        StoryPreference: [{
          $: story.preference,
        }],
        InCopyExportOption: [{
          $: {
            IncludeGraphicProxies: 'true',
            IncludeAllResources: 'false',
          },
        }],
        ParagraphStyleRange: story.paragraphs.map(para => serializeParagraph(para)),
      }],
    },
  };

  return builder.buildObject(storyObj);
}

/**
 * Serialize a paragraph to XML structure
 */
function serializeParagraph(paragraph: ParagraphData): any {
  const paraObj: any = {
    $: {
      AppliedParagraphStyle: paragraph.appliedParagraphStyle,
    },
    CharacterStyleRange: paragraph.characterRanges.map(range => serializeCharacterRange(range)),
  };

  // Add optional paragraph attributes
  if (paragraph.spaceBefore !== undefined) {
    paraObj.$.SpaceBefore = paragraph.spaceBefore.toString();
  }
  if (paragraph.spaceAfter !== undefined) {
    paraObj.$.SpaceAfter = paragraph.spaceAfter.toString();
  }
  if (paragraph.justification) {
    paraObj.$.Justification = paragraph.justification;
  }

  return paraObj;
}

/**
 * Serialize a character range to XML structure
 */
function serializeCharacterRange(range: CharacterRangeData): any {
  const charObj: any = {
    $: {
      AppliedCharacterStyle: range.appliedCharacterStyle,
    },
    Properties: [{
      AppliedFont: [{
        $: { type: 'string' },
        _: range.fontFamily || 'Arial',
      }],
    }],
  };

  // Add optional character attributes
  if (range.fillColor) {
    charObj.$.FillColor = range.fillColor;
  }
  if (range.fontSize) {
    charObj.$.PointSize = range.fontSize.toString();
  }
  if (range.fontStyle) {
    charObj.$.FontStyle = range.fontStyle;
  }
  if (range.characterDirection) {
    charObj.$.CharacterDirection = range.characterDirection;
  }

  // Preserve gradient attributes if present
  if (range.gradientFillAngle !== undefined) {
    charObj.$.GradientFillAngle = range.gradientFillAngle.toString();
  }
  if (range.gradientFillLength !== undefined) {
    charObj.$.GradientFillLength = range.gradientFillLength.toString();
  }
  if (range.gradientFillStart) {
    charObj.$.GradientFillStart = range.gradientFillStart;
  }

  // Preserve any additional properties from original XML
  if (range.properties) {
    Object.assign(charObj.$, range.properties);
  }

  // Add content
  if (range.content) {
    const lines = range.content.split('\n');
    if (lines.length === 1) {
      charObj.Content = [range.content];
    } else {
      // Handle multiple lines with line breaks
      charObj.Content = [lines[0]];
      for (let i = 1; i < lines.length; i++) {
        charObj.Br = charObj.Br || [];
        charObj.Br.push({});
        if (lines[i]) {
          charObj.Content.push(lines[i]);
        }
      }
    }
  }

  return charObj;
}

/**
 * Update StoryData from edited text
 * Converts plain text changes back to structured StoryData
 */
export function updateStoryFromText(
  originalStory: StoryData,
  newText: string,
  styles?: Array<any>
): StoryData {
  // Split text into paragraphs
  const paragraphTexts = newText.split('\n\n');

  const updatedParagraphs: ParagraphData[] = [];

  for (let i = 0; i < paragraphTexts.length; i++) {
    const paraText = paragraphTexts[i];

    // Use original paragraph structure if available
    const originalPara = originalStory.paragraphs[i];

    if (originalPara && styles) {
      // TODO: Apply styles from Fabric text editing
      // For now, just update the content
      const updatedRanges = originalPara.characterRanges.map((range, idx) => ({
        ...range,
        content: idx === 0 ? paraText : range.content,
      }));

      updatedParagraphs.push({
        ...originalPara,
        characterRanges: updatedRanges,
      });
    } else {
      // Create new paragraph with default styling
      updatedParagraphs.push({
        appliedParagraphStyle: originalPara?.appliedParagraphStyle || 'ParagraphStyle/$ID/NormalParagraphStyle',
        justification: originalPara?.justification,
        spaceBefore: originalPara?.spaceBefore,
        spaceAfter: originalPara?.spaceAfter,
        characterRanges: [{
          appliedCharacterStyle: 'CharacterStyle/$ID/[No character style]',
          content: paraText,
          fontFamily: 'Arial',
          fontSize: 14,
        }],
      });
    }
  }

  return {
    ...originalStory,
    paragraphs: updatedParagraphs,
  };
}

/**
 * Save story XML to file
 */
export async function saveStoryXML(storyData: StoryData, filePath: string): Promise<void> {
  const xml = serializeStoryToXML(storyData);

  // Import writeFile dynamically (server-side only)
  const { writeFile } = await import('fs/promises');
  await writeFile(filePath, xml, 'utf-8');

  console.log(`Story saved to ${filePath}`);
}
