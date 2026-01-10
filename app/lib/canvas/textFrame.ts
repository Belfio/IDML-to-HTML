import { fabric } from 'fabric';
import type { StoryData, CharacterRangeData } from '../textEditor/storyParser.server';
import { storyToPlainText, getCharacterStyles, mapJustification } from '../textEditor/storyUtils';

/**
 * Custom TextFrame class extending Fabric IText
 *
 * Key Responsibilities:
 * - Render editable text from Story XML
 * - Apply character and paragraph formatting
 * - Track text changes for serialization back to Story XML
 * - Handle text selection and editing
 */

export interface TextFrameOptions extends fabric.ITextOptions {
  idmlId?: string;
  parentStory?: string;
  storyData?: StoryData;
  originalTransform?: string;
  contentType?: string;
}

export class IDMLTextFrame extends fabric.IText {
  idmlId: string;
  parentStory: string;
  storyData?: StoryData;
  originalTransform: string;
  contentType: string;

  constructor(text: string, options: TextFrameOptions = {}) {
    super(text, {
      ...options,
      editable: true,
      selectable: true,
    });

    this.idmlId = options.idmlId || '';
    this.parentStory = options.parentStory || '';
    this.storyData = options.storyData;
    this.originalTransform = options.originalTransform || '';
    this.contentType = options.contentType || 'TextType';
  }

  /**
   * Create a TextFrame from IDML TextFrame element and Story data
   */
  static fromIDML(
    textFrameAttrs: { Self: string; ParentStory: string; ItemTransform: string; ContentType: string },
    transform: { left: number; top: number; scaleX: number; scaleY: number; angle: number },
    storyData?: StoryData
  ): IDMLTextFrame {
    // Get text content
    const text = storyData ? storyToPlainText(storyData) : 'Loading...';

    // Get text alignment from first paragraph
    const textAlign = storyData && storyData.paragraphs.length > 0
      ? mapJustification(storyData.paragraphs[0].justification)
      : 'left';

    // Get font styles from first character range
    let defaultStyles: Record<string, any> = {
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#000000',
    };

    if (storyData && storyData.paragraphs.length > 0 && storyData.paragraphs[0].characterRanges.length > 0) {
      const firstRange = storyData.paragraphs[0].characterRanges[0];
      defaultStyles = {
        ...defaultStyles,
        ...getCharacterStyles(firstRange),
      };
    }

    const textFrame = new IDMLTextFrame(text, {
      left: transform.left,
      top: transform.top,
      scaleX: transform.scaleX,
      scaleY: transform.scaleY,
      angle: transform.angle,
      textAlign: textAlign as any,
      ...defaultStyles,
      idmlId: textFrameAttrs.Self,
      parentStory: textFrameAttrs.ParentStory,
      storyData: storyData,
      originalTransform: textFrameAttrs.ItemTransform,
      contentType: textFrameAttrs.ContentType,
      // Visual styling
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: 10,
      borderColor: '#cccccc',
      cornerSize: 10,
    });

    return textFrame;
  }

  /**
   * Apply character styles to text range
   */
  setCharacterStyle(start: number, end: number, styles: Record<string, any>) {
    // Apply styles to specific text range
    for (let i = start; i < end && i < this.text!.length; i++) {
      this.setSelectionStyles(styles, i, i + 1);
    }

    this.canvas?.requestRenderAll();
  }

  /**
   * Apply paragraph formatting
   */
  setParagraphStyle(styles: { textAlign?: string; lineHeight?: number; charSpacing?: number }) {
    if (styles.textAlign) {
      this.set('textAlign', styles.textAlign as any);
    }
    if (styles.lineHeight) {
      this.set('lineHeight', styles.lineHeight);
    }
    if (styles.charSpacing) {
      this.set('charSpacing', styles.charSpacing);
    }

    this.canvas?.requestRenderAll();
  }

  /**
   * Get current text with formatting
   * Returns data suitable for serialization back to Story XML
   */
  getTextWithFormatting(): { text: string; styles: any[] } {
    const text = this.text || '';
    const styles: any[] = [];

    // Extract style information for each character
    for (let i = 0; i < text.length; i++) {
      const charStyles = this.getSelectionStyles(i, i + 1);
      styles.push(charStyles);
    }

    return { text, styles };
  }

  /**
   * Check if text has been modified
   */
  hasChanged(): boolean {
    if (!this.storyData) return true;

    const originalText = storyToPlainText(this.storyData);
    const currentText = this.text || '';

    return originalText !== currentText;
  }

  /**
   * Get modification info for auto-save
   */
  getModificationInfo() {
    return {
      idmlId: this.idmlId,
      parentStory: this.parentStory,
      hasChanged: this.hasChanged(),
      textData: this.getTextWithFormatting(),
    };
  }
}

/**
 * Factory function to create TextFrame from IDML data
 */
export function createTextFrameFromIDML(
  textFrameAttrs: { Self: string; ParentStory: string; ItemTransform: string; ContentType: string },
  transform: { left: number; top: number; scaleX: number; scaleY: number; angle: number },
  storyData?: StoryData
): IDMLTextFrame {
  return IDMLTextFrame.fromIDML(textFrameAttrs, transform, storyData);
}
