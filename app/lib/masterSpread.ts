import { XMLParser } from "fast-xml-parser";

interface MasterSpreadAttributes {
  Self: string;
  Name: string;
  NamePrefix: string;
  BaseName: string;
  ShowMasterItems: boolean;
  PageCount: number;
  PrimaryTextFrame: string;
  ItemTransform: string;
}

interface PageAttributes {
  Self: string;
  TabOrder: string;
  AppliedMaster: string;
  MasterPageTransform: string;
  Name: string;
  AppliedTrapPreset: string;
  GeometricBounds: string;
  ItemTransform: string;
  LayoutRule: string;
  OptionalPage: boolean;
  GridStartingPoint: string;
  UseMasterGrid: boolean;
}

interface MarginPreference {
  ColumnCount: number;
  ColumnGutter: number;
  Top: number;
  Bottom: number;
  Left: number;
  Right: number;
  ColumnDirection: string;
  ColumnsPositions: string[];
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

interface TextFrameAttributes {
  Self: string;
  ParentStory: string;
  PreviousTextFrame: string;
  NextTextFrame: string;
  ContentType: string;
  AllowOverrides: boolean;
  Visible: boolean;
  ItemTransform: string;
  PathGeometry: {
    GeometryPathType: {
      PathOpen: boolean;
      PathPointArray: Array<{
        Anchor: string;
        LeftDirection: string;
        RightDirection: string;
      }>;
    };
  };
}

interface ParsedMasterSpread {
  html: string;
  css: string;
}

export class MasterSpreadParser {
  private readonly POINTS_TO_PIXELS = 0.75; // Convert points to pixels

  constructor(private xmlString: string) {}

  async parse(): Promise<ParsedMasterSpread> {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseAttributeValue: true,
    });

    const parsed = parser.parse(this.xmlString);
    const masterSpread = parsed["idPkg:MasterSpread"].MasterSpread;
    const masterSpreadAttrs = masterSpread as MasterSpreadAttributes;

    const pages = this.parsePages(masterSpread.Page);
    const textFrames = this.parseTextFrames(masterSpread.TextFrame);

    return {
      html: this.generateHTML(masterSpreadAttrs, pages, textFrames),
      css: this.generateCSS(pages, textFrames),
    };
  }

  private parsePages(pagesData: PageAttributes[]): Array<{
    attributes: PageAttributes;
    margins: MarginPreference;
    grid: GridDataInformation;
  }> {
    return pagesData.map((page) => ({
      attributes: {
        Self: page.Self,
        TabOrder: page.TabOrder,
        AppliedMaster: page.AppliedMaster,
        MasterPageTransform: page.MasterPageTransform,
        Name: page.Name,
        AppliedTrapPreset: page.AppliedTrapPreset,
        GeometricBounds: page.GeometricBounds,
        ItemTransform: page.ItemTransform,
        LayoutRule: page.LayoutRule,
        OptionalPage: page.OptionalPage,
        GridStartingPoint: page.GridStartingPoint,
        UseMasterGrid: page.UseMasterGrid,
      },
      margins: this.parseMarginPreference(page.MarginPreference),
      grid: this.parseGridData(page.GridDataInformation),
    }));
  }

  private parseMarginPreference(margin: any): MarginPreference {
    return {
      ColumnCount: Number(margin.ColumnCount),
      ColumnGutter: Number(margin.ColumnGutter),
      Top: Number(margin.Top),
      Bottom: Number(margin.Bottom),
      Left: Number(margin.Left),
      Right: Number(margin.Right),
      ColumnDirection: margin.ColumnDirection,
      ColumnsPositions: margin.ColumnsPositions.split(" ").map(Number),
    };
  }

  private parseGridData(grid: any): GridDataInformation {
    return {
      FontStyle: grid.FontStyle,
      PointSize: Number(grid.PointSize),
      CharacterAki: Number(grid.CharacterAki),
      LineAki: Number(grid.LineAki),
      HorizontalScale: Number(grid.HorizontalScale),
      VerticalScale: Number(grid.VerticalScale),
      LineAlignment: grid.LineAlignment,
      GridAlignment: grid.GridAlignment,
      CharacterAlignment: grid.CharacterAlignment,
      AppliedFont: grid.Properties.AppliedFont[0],
    };
  }

  private parseTextFrames(
    framesData: TextFrameAttributes[]
  ): TextFrameAttributes[] {
    return framesData.map((frame) => ({
      Self: frame.Self,
      ParentStory: frame.ParentStory,
      PreviousTextFrame: frame.PreviousTextFrame,
      NextTextFrame: frame.NextTextFrame,
      ContentType: frame.ContentType,
      AllowOverrides: frame.AllowOverrides,
      Visible: frame.Visible,
      ItemTransform: frame.ItemTransform,
      PathGeometry: frame.PathGeometry,
    }));
  }

  private generateHTML(
    masterSpreadAttrs: MasterSpreadAttributes,
    pages: Array<{
      attributes: PageAttributes;
      margins: MarginPreference;
      grid: GridDataInformation;
    }>,
    textFrames: TextFrameAttributes[]
  ): string {
    return `
      <div class="master-spread" id="${masterSpreadAttrs.Self}"
        data-name="${masterSpreadAttrs.Name}"
        data-name-prefix="${masterSpreadAttrs.NamePrefix}"
        data-base-name="${masterSpreadAttrs.BaseName}"
        data-page-count="${masterSpreadAttrs.PageCount}"
        style="transform: ${this.transformToCSS(
          masterSpreadAttrs.ItemTransform
        )}">
        ${pages
          .map(
            (page, index) => `
          <div class="page page-${index + 1}" id="${page.attributes.Self}"
            data-name="${page.attributes.Name}"
            style="
              transform: ${this.transformToCSS(page.attributes.ItemTransform)};
              width: ${this.getBounds(page.attributes.GeometricBounds).width}px;
              height: ${
                this.getBounds(page.attributes.GeometricBounds).height
              }px;
            ">
            ${this.generateTextFramesHTML(textFrames)}
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  private generateCSS(
    pages: Array<{
      attributes: PageAttributes;
      margins: MarginPreference;
      grid: GridDataInformation;
    }>,
    textFrames: TextFrameAttributes[]
  ): string {
    return `
      .master-spread {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .page {
        position: relative;
        margin: 0 auto;
      }

      ${pages
        .map(
          (page, index) => `
        .page-${index + 1} {
          padding: ${page.margins.Top}px ${page.margins.Right}px ${
            page.margins.Bottom
          }px ${page.margins.Left}px;
          column-count: ${page.margins.ColumnCount};
          column-gap: ${page.margins.ColumnGutter}px;
        }
      `
        )
        .join("")}

      ${this.generateTextFramesCSS(textFrames)}
    `;
  }

  private generateTextFramesHTML(textFrames: TextFrameAttributes[]): string {
    return textFrames
      .map(
        (frame) => `
      <div class="text-frame" id="${frame.Self}"
        data-parent-story="${frame.ParentStory}"
        data-content-type="${frame.ContentType}"
        style="transform: ${this.transformToCSS(frame.ItemTransform)};">
      </div>
    `
      )
      .join("");
  }

  private generateTextFramesCSS(textFrames: TextFrameAttributes[]): string {
    return textFrames
      .map(
        (frame) => `
      #${frame.Self} {
        position: absolute;
        ${this.getTextFrameGeometry(frame.PathGeometry)}
      }
    `
      )
      .join("");
  }

  private transformToCSS(transform: string): string {
    const values = transform.split(" ").map(Number);
    return `matrix(${values.join(", ")})`;
  }

  private getBounds(bounds: string): { width: number; height: number } {
    const [top, left, bottom, right] = bounds.split(" ").map(Number);
    return {
      width: (right - left) * this.POINTS_TO_PIXELS,
      height: (bottom - top) * this.POINTS_TO_PIXELS,
    };
  }

  private getTextFrameGeometry(
    pathGeometry: TextFrameAttributes["PathGeometry"]
  ): string {
    const points = pathGeometry.GeometryPathType.PathPointArray;
    const [x1, y1] = points[0].Anchor.split(" ").map(Number);
    const [x2, y2] = points[2].Anchor.split(" ").map(Number);

    return `
      left: ${x1 * this.POINTS_TO_PIXELS}px;
      top: ${y1 * this.POINTS_TO_PIXELS}px;
      width: ${(x2 - x1) * this.POINTS_TO_PIXELS}px;
      height: ${(y2 - y1) * this.POINTS_TO_PIXELS}px;
    `;
  }
}
