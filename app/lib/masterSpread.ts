interface PageProperties {
  geometricBounds: number[];
  itemTransform: number[];
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  columns: {
    count: number;
    gutter: number;
    positions: number[];
  };
}

interface TextFrameProperties {
  self: string;
  transform: number[];
  width: number;
  height: number;
  position: {
    x: number;
    y: number;
  };
}

// Usage example:
//   const parser = new MasterSpreadParser(xmlString);
//   const { html, css } = await parser.parse();

export class MasterSpreadParser {
  private readonly POINTS_TO_PIXELS = 1; // Conversion factor from points to pixels

  constructor(private xmlString: string) {}

  async parse(): Promise<{ html: string; css: string }> {
    const { XMLParser } = await import("fast-xml-parser");
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });

    const parsed = parser.parse(xmlString);
    const masterSpread = parsed["idPkg:MasterSpread"].MasterSpread;

    const pages = this.parsePages(masterSpread.Page);
    const textFrames = this.parseTextFrames(masterSpread.TextFrame);

    return {
      html: this.generateHTML(pages, textFrames),
      css: this.generateCSS(pages, textFrames),
    };
  }

  private parsePages(pagesData: any[]): PageProperties[] {
    return pagesData.map((page) => ({
      geometricBounds: page.GeometricBounds.split(" ").map(Number),
      itemTransform: page.ItemTransform.split(" ").map(Number),
      margins: {
        top: Number(page.MarginPreference.Top),
        bottom: Number(page.MarginPreference.Bottom),
        left: Number(page.MarginPreference.Left),
        right: Number(page.MarginPreference.Right),
      },
      columns: {
        count: Number(page.MarginPreference.ColumnCount),
        gutter: Number(page.MarginPreference.ColumnGutter),
        positions:
          page.MarginPreference.ColumnsPositions.split(" ").map(Number),
      },
    }));
  }

  private parseTextFrames(framesData: any[]): TextFrameProperties[] {
    return framesData.map((frame) => {
      const transform = frame.ItemTransform.split(" ").map(Number);
      const pathPoints =
        frame.Properties.PathGeometry.GeometryPathType.PathPointArray;

      // Calculate width and height from path points
      const width =
        Math.abs(
          Number(pathPoints[2].Anchor.split(" ")[0]) -
            Number(pathPoints[0].Anchor.split(" ")[0])
        ) * 2;
      const height =
        Math.abs(
          Number(pathPoints[1].Anchor.split(" ")[1]) -
            Number(pathPoints[0].Anchor.split(" ")[1])
        ) * 2;

      return {
        self: frame.Self,
        transform,
        width: width * this.POINTS_TO_PIXELS,
        height: height * this.POINTS_TO_PIXELS,
        position: {
          x: transform[4] * this.POINTS_TO_PIXELS,
          y: transform[5] * this.POINTS_TO_PIXELS,
        },
      };
    });
  }

  private generateHTML(
    pages: PageProperties[],
    textFrames: TextFrameProperties[]
  ): string {
    return `
        <div class="master-spread">
          ${pages
            .map(
              (page, index) => `
            <div class="page page-${index + 1}">
              ${textFrames
                .map(
                  (frame) => `
                <div class="text-frame" id="frame-${frame.self}"></div>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
        </div>
      `;
  }

  private generateCSS(
    pages: PageProperties[],
    textFrames: TextFrameProperties[]
  ): string {
    return `
        .master-spread {
          position: relative;
          width: 100%;
          height: 100%;
        }
  
        .page {
          position: relative;
          width: ${pages[0].geometricBounds[2]}px;
          height: ${pages[0].geometricBounds[3]}px;
          margin: 0 auto;
        }
  
        ${pages
          .map(
            (page, index) => `
          .page-${index + 1} {
            padding: ${page.margins.top}px ${page.margins.right}px ${
              page.margins.bottom
            }px ${page.margins.left}px;
          }
        `
          )
          .join("")}
  
        ${textFrames
          .map(
            (frame) => `
          #frame-${frame.self} {
            position: absolute;
            left: ${frame.position.x}px;
            top: ${frame.position.y}px;
            width: ${frame.width}px;
            height: ${frame.height}px;
            border: 1px solid #ccc;
          }
        `
          )
          .join("")}
      `;
  }
}
