import * as fs from "fs";
import * as xml2js from "xml2js";

// Types for parsed objects
interface Spread {
  page: Page[];
}

interface Page {
  id: string;
  width: number;
  height: number;
  margin: MarginPreference;
  frames: Frame[];
}

interface MarginPreference {
  top: number;
  bottom: number;
  left: number;
  right: number;
  columnCount: number;
  columnGutter: number;
}

interface Frame {
  type: "text" | "graphic";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  imageSrc?: string;
}

// Main function to parse XML and generate HTML and CSS
async function parseSpreadXML(
  filePath: string
): Promise<{ html: string; css: string }> {
  const xmlData = fs.readFileSync(filePath, "utf-8");
  const spreadData = await xml2js.parseStringPromise(xmlData);

  // Parse spread and page information
  const spread = parseSpread(spreadData);
  const { html, css } = generateHTMLAndCSS(spread);

  return { html, css };
}

// Parse Spread from XML structure
function parseSpread(data: any): Spread {
  const spread: Spread = { page: [] };

  data["idPkg:Spread"].Page.forEach((pageData: any) => {
    const page = parsePage(pageData);
    spread.page.push(page);
  });

  return spread;
}

// Parse Page from XML structure
function parsePage(pageData: any): Page {
  const bounds = pageData.$.GeometricBounds.split(" ").map(Number);
  const width = bounds[3] - bounds[1];
  const height = bounds[2] - bounds[0];

  const margin = parseMargin(pageData.MarginPreference[0].$);
  const frames = parseFrames(pageData);

  return { id: pageData.$.Self, width, height, margin, frames };
}

// Parse Margin Preferences
function parseMargin(data: any): MarginPreference {
  return {
    top: parseFloat(data.Top),
    bottom: parseFloat(data.Bottom),
    left: parseFloat(data.Left),
    right: parseFloat(data.Right),
    columnCount: parseInt(data.ColumnCount),
    columnGutter: parseFloat(data.ColumnGutter),
  };
}

// Parse Frames (text and graphic)
function parseFrames(pageData: any): Frame[] {
  const frames: Frame[] = [];

  if (pageData.TextFrame) {
    pageData.TextFrame.forEach((frameData: any) => {
      const frame = parseTextFrame(frameData);
      frames.push(frame);
    });
  }

  if (pageData.GraphicFrame) {
    pageData.GraphicFrame.forEach((frameData: any) => {
      const frame = parseGraphicFrame(frameData);
      frames.push(frame);
    });
  }

  return frames;
}

// Parse Text Frame
function parseTextFrame(frameData: any): Frame {
  const bounds = frameData.$.GeometricBounds.split(" ").map(Number);
  const width = bounds[3] - bounds[1];
  const height = bounds[2] - bounds[0];
  const x = bounds[1];
  const y = bounds[0];
  const content = frameData.Content?.[0] || "";

  return { type: "text", x, y, width, height, content };
}

// Parse Graphic Frame
function parseGraphicFrame(frameData: any): Frame {
  const bounds = frameData.$.GeometricBounds.split(" ").map(Number);
  const width = bounds[3] - bounds[1];
  const height = bounds[2] - bounds[0];
  const x = bounds[1];
  const y = bounds[0];
  const imageSrc = frameData.Image?.[0].$.Href || "";

  return { type: "graphic", x, y, width, height, imageSrc };
}

// Generate HTML and CSS based on parsed data
function generateHTMLAndCSS(spread: Spread): { html: string; css: string } {
  let html = "";
  let css = "";

  spread.page.forEach((page, index) => {
    html += `<div class="page page-${index}">\n`;
    css += `.page-${index} {\n  width: ${page.width}px;\n  height: ${page.height}px;\n`;
    css += `  display: grid;\n  grid-template-columns: repeat(${page.margin.columnCount}, 1fr);\n`;
    css += `  gap: ${page.margin.columnGutter}px;\n  padding: ${page.margin.top}px ${page.margin.right}px ${page.margin.bottom}px ${page.margin.left}px;\n}\n`;

    page.frames.forEach((frame, i) => {
      const frameClass = `frame-${index}-${i}`;
      if (frame.type === "text") {
        html += `<div class="${frameClass} text-frame">${frame.content}</div>\n`;
        css += `.${frameClass} { position: absolute; top: ${frame.y}px; left: ${frame.x}px; width: ${frame.width}px; height: ${frame.height}px; }\n`;
      } else if (frame.type === "graphic") {
        html += `<div class="${frameClass} graphic-frame"><img src="${frame.imageSrc}" alt="Graphic Frame"></div>\n`;
        css += `.${frameClass} { position: absolute; top: ${frame.y}px; left: ${frame.x}px; width: ${frame.width}px; height: ${frame.height}px; }\n`;
      }
    });

    html += "</div>\n";
  });

  return { html, css };
}

// Run parser
parseSpreadXML("path/to/Spread_u183.xml")
  .then(({ html, css }) => {
    console.log("Generated HTML:\n", html);
    console.log("Generated CSS:\n", css);
  })
  .catch((err) => console.error("Error parsing XML:", err));
