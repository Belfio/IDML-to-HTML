import * as fs from "fs";
import * as xml2js from "xml2js";

// Type definitions based on IDML specification
interface StoryAttributes {
  Self: string;
  UserText: boolean;
  IsEndnoteStory: boolean;
  AppliedTOCStyle: string;
  TrackChanges: boolean;
  StoryTitle: string;
}

interface ParagraphStyleRange {
  $: {
    AppliedParagraphStyle: string;
    SpaceBefore?: string;
    SpaceAfter?: string;
    Justification?: string;
  };
  CharacterStyleRange: CharacterStyleRange[];
}

interface CharacterStyleRange {
  $: {
    AppliedCharacterStyle: string;
    FillColor?: string;
    FontStyle?: string;
    PointSize?: string;
    CharacterDirection?: string;
  };
  Properties: [
    {
      AppliedFont: [
        {
          _: string;
          $: { type: string };
        }
      ];
    }
  ];
  Content?: string[];
  Br?: any[];
}

// Function to parse Story XML and convert to HTML
export function parseStoryToHTML(filePath: string): string {
  const parser = new xml2js.Parser();
  let htmlOutput = "";

  try {
    const data = fs.readFileSync(filePath);
    let result: any;

    parser.parseString(data, (err, parsedResult) => {
      if (err) throw err;
      result = parsedResult;
    });

    const story = result["idPkg:Story"].Story[0];
    const storyAttrs = story.$ as StoryAttributes;

    // Create story container with attributes
    htmlOutput = `<div id="${storyAttrs.Self}" class="story" 
      data-user-text="${storyAttrs.UserText}"
      data-is-endnote-story="${storyAttrs.IsEndnoteStory}"
      data-track-changes="${storyAttrs.TrackChanges}">\n`;

    // Parse ParagraphStyleRanges
    if (story.ParagraphStyleRange) {
      story.ParagraphStyleRange.forEach(
        (paragraphRange: ParagraphStyleRange) => {
          const paragraphAttrs = paragraphRange.$;

          // Create paragraph element with styles
          htmlOutput += `<p class="${paragraphAttrs.AppliedParagraphStyle.replace(
            "ParagraphStyle/",
            ""
          )}"
          style="
            ${
              paragraphAttrs.SpaceBefore
                ? `margin-top: ${paragraphAttrs.SpaceBefore}em;`
                : ""
            }
            ${
              paragraphAttrs.SpaceAfter
                ? `margin-bottom: ${paragraphAttrs.SpaceAfter}em;`
                : ""
            }
            ${
              paragraphAttrs.Justification
                ? `text-align: ${mapJustification(
                    paragraphAttrs.Justification
                  )};`
                : ""
            }
          ">\n`;

          // Parse CharacterStyleRanges
          if (paragraphRange.CharacterStyleRange) {
            paragraphRange.CharacterStyleRange.forEach(
              (charRange: CharacterStyleRange) => {
                const charAttrs = charRange.$;
                const fontFamily = charRange.Properties?.[0]?.AppliedFont?.[0];

                // Create span for character styling
                htmlOutput += `<span class="${charAttrs.AppliedCharacterStyle.replace(
                  "CharacterStyle/",
                  ""
                )}"
              style="
                ${
                  charAttrs.FillColor
                    ? `color: ${mapColor(charAttrs.FillColor)};`
                    : ""
                }
                ${
                  charAttrs.FontStyle
                    ? `font-style: ${charAttrs.FontStyle.toLowerCase()};`
                    : ""
                }
                ${
                  charAttrs.PointSize
                    ? `font-size: ${charAttrs.PointSize}pt;`
                    : ""
                }
                ${fontFamily ? `font-family: ${fontFamily};` : ""}
                ${
                  charAttrs.CharacterDirection
                    ? `direction: ${mapDirection(
                        charAttrs.CharacterDirection
                      )};`
                    : ""
                }
              ">`;

                // Add content
                if (charRange.Content) {
                  htmlOutput += charRange.Content.join("");
                }

                // Handle line breaks
                if (charRange.Br) {
                  htmlOutput += "<br/>";
                }

                htmlOutput += "</span>";
              }
            );
          }

          htmlOutput += "</p>\n";
        }
      );
    }

    htmlOutput += "</div>";
    return htmlOutput;
  } catch (error) {
    console.error("Error parsing story:", error);
    return "";
  }
}

// Helper functions for mapping IDML values to CSS
function mapJustification(justification: string): string {
  const map: { [key: string]: string } = {
    LeftJustified: "left",
    CenterJustified: "center",
    RightJustified: "right",
    FullyJustified: "justify",
  };
  return map[justification] || "left";
}

function mapColor(color: string): string {
  if (color === "Color/Paper") return "white";
  // Add more color mappings as needed
  return color.replace("Color/", "").toLowerCase();
}

function mapDirection(direction: string): string {
  return direction === "LeftToRightDirection" ? "ltr" : "rtl";
}

// Test function to process multiple story files
export function testStoryParser() {
  const storyFiles = [
    "unpacked/Stories/Story_ucf1.xml",
    "unpacked/Stories/Story_ud0a.xml",
  ];

  storyFiles.forEach((file) => {
    console.log(`\nParsing ${file}...`);
    const html = parseStoryToHTML(file);

    // Write output to file for inspection
    const outputFile = `parsed-${file
      .split("/")
      .pop()
      ?.replace(".xml", ".html")}`;
    fs.writeFileSync(outputFile, html);
    console.log(`Output written to ${outputFile}`);
  });
}
