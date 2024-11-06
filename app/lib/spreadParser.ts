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
export default async function parseSpreadXML(
  filePath: string
): Promise<{ html: string; css: string }> {
  const xmlData = fs.readFileSync(filePath, "utf-8");
  const spreadData = await xml2js.parseStringPromise(xmlData);

  // Parse spread and page information
  console.log("working");
  const spreadNode = spreadData["idPkg:Spread"].Spread[0];

  const { html, css } = generateHtmlAndCssFromSpread(spreadNode);
  // const spread = parseSpread(spreadData);
  // const { html, css } = generateHTMLAndCSS(spread);

  return { html, css };
}

// Parse Spread from XML structure
function parseSpread(data: any): Spread {
  // Access the Spread array within idPkg:Spread
  const spreadNode = data["idPkg:Spread"].Spread[0];

  const spread: Spread = { pages: [] };

  // Check for Page nodes within Spread (if they exist)
  console.log(spreadNode);
  if (spreadNode.Page) {
    spreadNode.Page.forEach((pageData: any) => {
      const page = parsePage(pageData);
      spread.pages.push(page);
    });
  }

  return spread;
}

// Parse Page from XML structure
function parsePage(pageData: any): Page {
  return {
    id: pageData.Self,
    transitionType: pageData.PageTransitionType,
    transitionDirection: pageData.PageTransitionDirection,
    transitionDuration: pageData.PageTransitionDuration,
    pageCount: parseInt(pageData.PageCount, 10),
    bindingLocation: parseInt(pageData.BindingLocation, 10),
    allowPageShuffle: pageData.AllowPageShuffle === "true",
  };
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

function generateHtmlAndCssFromSpread(spread: any): {
  html: string;
  css: string;
} {
  let html = `<div class="spread" id="${spread.$.Self}">\n`;
  let css = `.spread {\n  position: relative;\n  width: 100%;\n  height: auto;\n  display: block;\n}\n\n`;

  // Generate HTML and CSS for each page in the spread
  spread.Page.forEach((page: any, pageIndex: number) => {
    const pageId = page.$.Self || `page-${pageIndex}`;
    html += `  <div class="page" id="${pageId}">\n`;
    css += `#${pageId} {\n  position: relative;\n  margin: 20px;\n}\n\n`;

    // Extract and style rectangles
    if (spread.Rectangle) {
      spread.Rectangle.forEach((rect: any, rectIndex: number) => {
        const rectId = rect.$.Self || `rectangle-${rectIndex}`;
        const [x, y, width, height] =
          rect.$.GeometricBounds.split(" ").map(Number);

        html += `    <div class="rectangle" id="${rectId}"></div>\n`;
        css += `#${rectId} {\n  position: absolute;\n  top: ${y}px;\n  left: ${x}px;\n  width: ${
          width - x
        }px;\n  height: ${
          height - y
        }px;\n  background: #eee;\n  border: 1px solid #ccc;\n}\n\n`;
      });
    }

    // Extract and style text frames
    if (spread.TextFrame) {
      spread.TextFrame.forEach((textFrame: any, textIndex: number) => {
        const textId = textFrame.$.Self || `text-frame-${textIndex}`;
        const [x, y, width, height] =
          textFrame.$.GeometricBounds.split(" ").map(Number);
        const textContent = textFrame.Properties[0].Content || "Sample Text";

        html += `    <div class="text-frame" id="${textId}">${textContent}</div>\n`;
        css += `#${textId} {\n  position: absolute;\n  top: ${y}px;\n  left: ${x}px;\n  width: ${
          width - x
        }px;\n  height: ${
          height - y
        }px;\n  color: #333;\n  font-size: 14px;\n  padding: 4px;\n}\n\n`;
      });
    }

    // Extract and style graphic lines
    if (spread.GraphicLine) {
      spread.GraphicLine.forEach((line: any, lineIndex: number) => {
        const lineId = line.$.Self || `graphic-line-${lineIndex}`;
        const [x1, y1, x2, y2] = line.$.GeometricBounds.split(" ").map(Number);

        html += `    <div class="graphic-line" id="${lineId}"></div>\n`;
        css += `#${lineId} {\n  position: absolute;\n  top: ${y1}px;\n  left: ${x1}px;\n  width: ${
          x2 - x1
        }px;\n  height: ${y2 - y1}px;\n  border-top: 1px solid #000;\n}\n\n`;
      });
    }

    // Extract and style polygons
    if (spread.Polygon) {
      spread.Polygon.forEach((polygon: any, polygonIndex: number) => {
        const polygonId = polygon.$.Self || `polygon-${polygonIndex}`;
        const [x, y, width, height] =
          polygon.$.GeometricBounds.split(" ").map(Number);

        html += `    <div class="polygon" id="${polygonId}"></div>\n`;
        css += `#${polygonId} {\n  position: absolute;\n  top: ${y}px;\n  left: ${x}px;\n  width: ${
          width - x
        }px;\n  height: ${
          height - y
        }px;\n  background: #ccc;\n  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);\n}\n\n`;
      });
    }

    html += `  </div>\n`; // Close page div
  });

  html += `</div>\n`; // Close spread div

  return { html, css };
}

// Usage example
const parsedSpread = {
  // Spread JSON data here (e.g., parsed from XML)
};
