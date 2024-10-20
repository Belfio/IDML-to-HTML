import fs from "fs";
import path from "path";
import xml2js from "xml2js";

export default async function analyzeAndParse(unpackedDir) {
  const parser = new xml2js.Parser();
  const jsonOutput = {
    stories: [],
    spreads: [],
    styles: {},
    fonts: {},
    images: [],
  };

  // Parse Stories
  const storiesDir = path.join(unpackedDir, "Stories");
  const storyFiles = fs.readdirSync(storiesDir);

  for (const file of storyFiles) {
    if (file.endsWith(".xml")) {
      const data = fs.readFileSync(path.join(storiesDir, file));
      const result = await parser.parseStringPromise(data);
      // Extract text content and convert to HTML
      const paragraphs = extractParagraphs(result);
      jsonOutput.stories.push({
        file: file,
        content: paragraphs,
      });
    }
  }

  // Parse Styles
  const stylesFile = path.join(unpackedDir, "Resources", "Styles.xml");
  if (fs.existsSync(stylesFile)) {
    const data = fs.readFileSync(stylesFile);
    const result = await parser.parseStringPromise(data);
    const styles = extractStyles(result);
    jsonOutput.styles = styles;
  }

  // Additional parsing for Spreads, Fonts, Images, etc., can be added here

  return jsonOutput;
}

// Helper function to extract paragraphs and convert to HTML
function extractParagraphs(xmlData) {
  const paragraphs = [];
  const story = xmlData.DocumentStory;

  if (story && story.Story && story.Story[0]) {
    const storyContent = story.Story[0];
    const paragraphRanges = storyContent.ParagraphStyleRange || [];

    for (const paragraph of paragraphRanges) {
      let text = "";
      if (paragraph.CharacterStyleRange) {
        for (const charRange of paragraph.CharacterStyleRange) {
          if (charRange.Content) {
            text += charRange.Content.join("");
          }
        }
      }
      paragraphs.push(`<p>${text}</p>`);
    }
  }
  return paragraphs;
}

// Helper function to extract styles and convert to CSS
function extractStyles(xmlData) {
  const styles = {};

  if (xmlData.Styles && xmlData.Styles.ParagraphStyle) {
    const paragraphStyles = xmlData.Styles.ParagraphStyle;
    paragraphStyles.forEach((style) => {
      const styleName = style["$"].Self;
      styles[styleName] = {
        // Map style attributes to CSS properties
        fontSize: style.PointSize ? `${style.PointSize[0]}px` : undefined,
        fontWeight: style.FontStyle ? style.FontStyle[0] : undefined,
        // Add more mappings as needed
      };
    });
  }
  return styles;
}
