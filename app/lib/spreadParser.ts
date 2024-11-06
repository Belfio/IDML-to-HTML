import * as fs from "fs";
import * as xml2js from "xml2js";
import { parseStoryToHTML } from "./storiesParser";
import path from "path";
import idmlUrl from "~/assets/example.idml";

// Type definitions for XML structure
interface SpreadXML {
  "idPkg:Spread": {
    Spread: SpreadElement[];
  };
}

interface SpreadElement {
  $: SpreadAttributes;
  FlattenerPreference?: [
    {
      $: FlattenerPreference;
      Properties: [
        {
          RasterVectorBalance: [{ $: { type: string }; _: string }];
        }
      ];
    }
  ];
  Page?: PageElement[];
  Rectangle?: RectangleElement[];
  TextFrame?: TextFrameElement[];
  GraphicLine?: GraphicLineElement[];
  Group?: GroupElement[];
  Button?: ButtonElement[];
  AnimationSetting?: AnimationElement[];
  MultiStateObject?: MultiStateElement[];
  Polygon?: PolygonElement[];
}

interface PageElement {
  $: PageAttributes;
  Properties?: [
    {
      PageColor: [{ $: { type: string }; _: string }];
      Descriptor: [
        {
          ListItem: Array<{ $: { type: string }; _: string }>;
        }
      ];
    }
  ];
  MarginPreference?: [
    {
      $: MarginPreference;
    }
  ];
  GridDataInformation?: [
    {
      $: GridDataInformation;
      Properties: [
        {
          AppliedFont: [{ $: { type: string }; _: string }];
        }
      ];
    }
  ];
  Rectangle?: RectangleElement[];
  TextFrame?: TextFrameElement[];
  GraphicLine?: GraphicLineElement[];
  // ... other possible page children
}

interface RectangleElement {
  $: RectangleAttributes;
  Image?: ImageElement[];
}

interface TextFrameElement {
  $: TextFrameAttributes;
}

interface GraphicLineElement {
  $: GraphicLineAttributes;
}

interface GroupElement {
  $: GroupAttributes;
  Rectangle?: RectangleElement[];
  TextFrame?: TextFrameElement[];
  GraphicLine?: GraphicLineElement[];
}

interface ButtonElement {
  $: ButtonAttributes;
}

interface AnimationElement {
  $: AnimationSettingAttributes;
}

interface MultiStateElement {
  $: MultiStateObjectAttributes;
}

interface ImageElement {
  $: {
    ItemTransform: string;
  };
  Link?: [
    {
      $: {
        LinkResourceURI: string;
      };
    }
  ];
}

// Type definitions based on IDML specification
interface SpreadAttributes {
  Self: string;
  PageTransitionType: string;
  PageTransitionDirection: string;
  PageTransitionDuration: string;
  ShowMasterItems: boolean;
  PageCount: number;
  BindingLocation: string;
  AllowPageShuffle: boolean;
  ItemTransform: string;
  FlattenerOverride: string;
}

interface PageAttributes {
  Self: string;
  TabOrder: string;
  AppliedMaster: string;
  MasterPageTransform: string;
  Name: string;
  GeometricBounds: string;
  ItemTransform: string;
}

interface GuideAttributes {
  Self: string;
  Orientation: "Vertical" | "Horizontal";
  Location: string;
  FitToPage: boolean;
  ViewThreshold: number;
  Locked: boolean;
  ItemLayer: string;
}

interface MarginPreference {
  ColumnCount: number;
  ColumnGutter: number;
  Top: number;
  Bottom: number;
  Left: number;
  Right: number;
  ColumnDirection: string;
  ColumnsPositions: string;
}

interface TextFrameAttributes {
  Self: string;
  ParentStory: string;
  ContentType: string;
  ItemTransform: string;
}

interface RectangleAttributes {
  Self: string;
  ContentType: string;
  StoryTitle: string;
  Visible: boolean;
  ItemTransform: string;
  GradientFillStart?: string;
  GradientFillLength?: string;
  GradientFillAngle?: string;
  ItemLayer: string;
  Locked: boolean;
  LocalDisplaySetting: string;
  AppliedObjectStyle: string;
}

interface GraphicLineAttributes {
  Self: string;
  ContentType: string;
  StrokeColor: string;
  StrokeWeight: string;
  LeftLineEnd?: string;
  ItemTransform: string;
  ItemLayer: string;
}

interface GroupAttributes {
  Self: string;
  ItemTransform: string;
  Visible: boolean;
  Locked: boolean;
}

interface ButtonAttributes {
  Self: string;
  ItemTransform: string;
  Visible: boolean;
  Enabled: boolean;
}

interface AnimationSettingAttributes {
  Self: string;
  Duration: string;
  MotionPath: string;
}

interface MultiStateObjectAttributes {
  Self: string;
  InitialState: string;
  ItemTransform: string;
}

// Add new interfaces for missing elements
interface FlattenerPreference {
  LineArtAndTextResolution: string;
  GradientAndMeshResolution: string;
  ClipComplexRegions: boolean;
  ConvertAllStrokesToOutlines: boolean;
  ConvertAllTextToOutlines: boolean;
  RasterVectorBalance: number;
}

interface PageProperties {
  PageColor: string;
  Descriptor: {
    ListItem: Array<string | number | boolean>;
  };
}

interface GridDataInformation {
  FontStyle: string;
  PointSize: number;
  CharacterAki: number;
  LineAki: number;
  HorizontalScale: number;
  VerticalScale: number;
  LineAlignment: string;
  GridAlignment: string;
  CharacterAlignment: string;
  AppliedFont: string;
}

// Add Polygon interface
interface PolygonElement {
  $: PolygonAttributes;
}

interface PolygonAttributes {
  Self: string;
  ContentType: string;
  StoryTitle: string;
  OverriddenPageItemProps: string;
  Visible: boolean;
  Name: string;
  HorizontalLayoutConstraints: string;
  VerticalLayoutConstraints: string;
  GradientFillStart: string;
  GradientFillLength: string;
  GradientFillAngle: string;
  ItemLayer: string;
  Locked: boolean;
  LocalDisplaySetting: string;
  ItemTransform: string;
}

// Function to parse Spread XML and convert to HTML
export function parseSpreadToHTML(filePath: string): void {
  const parser = new xml2js.Parser();

  fs.readFile(filePath, (err, data) => {
    if (err) throw err;

    parser.parseString(data, (err, result: SpreadXML) => {
      if (err) throw err;

      const spread = result["idPkg:Spread"].Spread[0];
      let htmlOutput = generateSpreadContainer(spread.$);

      // Parse FlattenerPreference if exists
      if (spread.FlattenerPreference) {
        htmlOutput += generateFlattenerPreferenceHTML(
          spread.FlattenerPreference[0]
        );
      }

      // Parse direct children of Spread
      console.log(spread);
      htmlOutput = parseSpreadChildren(spread, htmlOutput);
      return;
      // Parse Pages and their children
      if (spread.Page) {
        spread.Page.forEach((page: PageElement) => {
          const pageHtml = generatePageContainer(page.$, page);
          htmlOutput += parsePageChildren(page, pageHtml);
          htmlOutput += "</div>\n"; // Close page
        });
      }

      htmlOutput += "</div>\n"; // Close spread

      // Write output to file
      fs.writeFileSync("parsed-spread.html", htmlOutput);
      console.log("Parsed spread written to parsed-spread.html");
    });
  });
}

function generateSpreadContainer(spreadAttrs: SpreadAttributes): string {
  return `<div id="${spreadAttrs.Self}" class="spread" 
    data-page-count="${spreadAttrs.PageCount}"
    data-binding-location="${spreadAttrs.BindingLocation}"
    data-page-transition-type="${spreadAttrs.PageTransitionType}"
    data-page-transition-direction="${spreadAttrs.PageTransitionDirection}"
    data-page-transition-duration="${spreadAttrs.PageTransitionDuration}"
    style="transform: ${spreadAttrs.ItemTransform};">\n`;
}

function generatePageContainer(
  pageAttrs: PageAttributes,
  page: PageElement
): string {
  const bounds = pageAttrs.GeometricBounds.split(" ").map(Number);
  const width = bounds[2] - bounds[0];
  const height = bounds[3] - bounds[1];

  let pageHTML = `<div id="${pageAttrs.Self}" class="page"
    data-name="${pageAttrs.Name}"
    data-applied-master="${pageAttrs.AppliedMaster}"
    style="width: ${width}px; height: ${height}px; transform: ${pageAttrs.ItemTransform};">\n`;

  // Add Properties if they exist
  if (page.Properties) {
    const props = page.Properties[0];
    pageHTML += `<div class="page-properties"
      data-page-color="${props.PageColor[0]._}"
      data-descriptor='${JSON.stringify(
        props.Descriptor[0].ListItem.map((item) => item._)
      )}'>
    </div>\n`;
  }

  // Add MarginPreference if it exists
  if (page.MarginPreference) {
    const margin = page.MarginPreference[0].$;
    pageHTML += `<div class="margin-preference"
      data-column-count="${margin.ColumnCount}"
      data-column-gutter="${margin.ColumnGutter}"
      style="
        padding: ${margin.Top}px ${margin.Right}px ${margin.Bottom}px ${margin.Left}px;
        column-count: ${margin.ColumnCount};
        column-gap: ${margin.ColumnGutter}px;
      ">
    </div>\n`;
  }

  // Add GridDataInformation if it exists
  if (page.GridDataInformation) {
    const grid = page.GridDataInformation[0].$;
    const appliedFont =
      page.GridDataInformation[0].Properties[0].AppliedFont[0]._;
    pageHTML += `<div class="grid-data"
      data-font-style="${grid.FontStyle}"
      data-point-size="${grid.PointSize}"
      data-character-aki="${grid.CharacterAki}"
      data-line-aki="${grid.LineAki}"
      data-horizontal-scale="${grid.HorizontalScale}"
      data-vertical-scale="${grid.VerticalScale}"
      data-line-alignment="${grid.LineAlignment}"
      data-grid-alignment="${grid.GridAlignment}"
      data-character-alignment="${grid.CharacterAlignment}"
      data-applied-font="${appliedFont}">
    </div>\n`;
  }

  return pageHTML;
}

function parseSpreadChildren(
  spread: SpreadElement,
  htmlOutput: string
): string {
  let output = htmlOutput;

  // Parse Rectangles at Spread level
  if (spread.Rectangle) {
    console.log("Retttangolo");
    console.log(spread.Rectangle);
    spread.Rectangle.forEach((rect: RectangleElement) => {
      output += generateRectangleHTML(rect);
    });
  }

  // Parse TextFrames at Spread level
  if (spread.TextFrame) {
    spread.TextFrame.forEach((frame: TextFrameElement) => {
      output += generateTextFrameHTML(frame);
    });
  }

  // Parse GraphicLines at Spread level
  if (spread.GraphicLine) {
    spread.GraphicLine.forEach((line: GraphicLineElement) => {
      output += generateGraphicLineHTML(line);
    });
  }

  // Parse Groups at Spread level
  if (spread.Group) {
    spread.Group.forEach((group: GroupElement) => {
      output += generateGroupHTML(group);
    });
  }

  // Parse Polygons at Spread level
  if (spread.Polygon) {
    spread.Polygon.forEach((polygon: PolygonElement) => {
      output += generatePolygonHTML(polygon);
    });
  }

  return output;
}

function parsePageChildren(page: PageElement, htmlOutput: string): string {
  let output = htmlOutput;

  // Parse Rectangles within Page
  if (page.Rectangle) {
    page.Rectangle.forEach((rect: RectangleElement) => {
      output += generateRectangleHTML(rect);
    });
  }

  // Parse TextFrames within Page
  if (page.TextFrame) {
    page.TextFrame.forEach((frame: TextFrameElement) => {
      output += generateTextFrameHTML(frame);
    });
  }

  // Parse GraphicLines within Page
  if (page.GraphicLine) {
    page.GraphicLine.forEach((line: GraphicLineElement) => {
      output += generateGraphicLineHTML(line);
    });
  }

  return output;
}

function generateRectangleHTML(rect: RectangleElement): string {
  const rectAttrs = rect.$;
  return `<div id="${rectAttrs.Self}" 
    class="rectangle"
    data-content-type="${rectAttrs.ContentType}"
    data-layer="${rectAttrs.ItemLayer}"
    data-locked="${rectAttrs.Locked}"
    style="transform: ${rectAttrs.ItemTransform};">
    ${rect.Image ? generateImageHTML(rect.Image[0]) : ""}
  </div>\n`;
}

function generateTextFrameHTML(frame: TextFrameElement): string {
  const frameAttrs = frame.$;
  let storyContent = "";

  try {
    // const idmlFilePath = path.join(process.cwd(), idmlUrl);

    const storyPath = getStoryPath(frameAttrs.ParentStory);
    storyContent = parseStoryToHTML(storyPath);
  } catch (error) {
    console.warn(
      `Could not load story ${frameAttrs.ParentStory} for text frame ${frameAttrs.Self}`
    );
  }

  return `<div id="${frameAttrs.Self}" 
    class="text-frame"
    data-content-type="${frameAttrs.ContentType}"
    data-parent-story="${frameAttrs.ParentStory}"
    style="transform: ${frameAttrs.ItemTransform};">
    ${storyContent}
  </div>\n`;
}

function generateGraphicLineHTML(line: GraphicLineElement): string {
  const lineAttrs = line.$;
  return `<hr id="${lineAttrs.Self}" 
    class="graphic-line"
    data-stroke-color="${lineAttrs.StrokeColor}"
    style="
      transform: ${lineAttrs.ItemTransform};
      border-top: ${lineAttrs.StrokeWeight}px solid;
    ">\n`;
}

function generateGroupHTML(group: GroupElement): string {
  const groupAttrs = group.$;
  const childrenHTML = parseGroupChildren(group);

  return `<div id="${groupAttrs.Self}" 
    class="group"
    data-visible="${groupAttrs.Visible}"
    data-locked="${groupAttrs.Locked}"
    style="transform: ${groupAttrs.ItemTransform};">
    ${childrenHTML}
  </div>\n`;
}

function parseGroupChildren(group: GroupElement): string {
  let output = "";

  if (group.Rectangle) {
    group.Rectangle.forEach((rect) => {
      output += generateRectangleHTML(rect);
    });
  }

  if (group.TextFrame) {
    group.TextFrame.forEach((frame) => {
      output += generateTextFrameHTML(frame);
    });
  }

  if (group.GraphicLine) {
    group.GraphicLine.forEach((line) => {
      output += generateGraphicLineHTML(line);
    });
  }

  return output;
}

function generateImageHTML(image: ImageElement): string {
  return `<img src="${image.Link?.[0].$.LinkResourceURI || ""}" 
    alt="" 
    style="transform: ${image.$.ItemTransform || "none"};"/>`;
}

// Helper function to get the story file path
function getStoryPath(storyId: string): string {
  const storyPath = path.join(
    process.cwd(),
    path.dirname(idmlUrl) + "/extracted/Stories" + `/Story_${storyId}.xml`
  );
  return storyPath;
}

// Add new generator functions
function generateFlattenerPreferenceHTML(
  flattener: SpreadElement["FlattenerPreference"][0]
): string {
  const attrs = flattener.$;
  const rasterVectorBalance = flattener.Properties[0].RasterVectorBalance[0]._;

  return `<div class="flattener-preference"
    data-line-art-resolution="${attrs.LineArtAndTextResolution}"
    data-gradient-resolution="${attrs.GradientAndMeshResolution}"
    data-clip-complex="${attrs.ClipComplexRegions}"
    data-convert-strokes="${attrs.ConvertAllStrokesToOutlines}"
    data-convert-text="${attrs.ConvertAllTextToOutlines}"
    data-raster-vector-balance="${rasterVectorBalance}">
  </div>\n`;
}

// Add Polygon generator function
function generatePolygonHTML(polygon: PolygonElement): string {
  const polygonAttrs = polygon.$;
  return `<div id="${polygonAttrs.Self}" 
    class="polygon"
    data-content-type="${polygonAttrs.ContentType}"
    data-layer="${polygonAttrs.ItemLayer}"
    data-locked="${polygonAttrs.Locked}"
    data-visible="${polygonAttrs.Visible}"
    style="transform: ${polygonAttrs.ItemTransform};">
  </div>\n`;
}
