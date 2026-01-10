import * as xml2js from 'xml2js';
import type { IDMLElement } from './fabricToIdml';

/**
 * Spread Serializer: Generate Spread XML from IDML elements
 *
 * Key Responsibilities:
 * - Build Spread XML structure
 * - Maintain proper IDML element ordering
 * - Preserve XML formatting (tabs, declaration)
 * - Handle nested elements (Groups)
 */

/**
 * Serialize IDML elements to Spread XML
 */
export async function serializeSpreadToXML(
  elements: IDMLElement[],
  spreadAttributes: Record<string, any>
): Promise<string> {
  // Group elements by type
  const grouped: Record<string, any[]> = {
    TextFrame: [],
    Rectangle: [],
    GraphicLine: [],
    Group: [],
    Polygon: [],
    Oval: [],
  };

  elements.forEach(element => {
    const xmlElement = elementToXMLObject(element);
    if (xmlElement && grouped[element.type]) {
      grouped[element.type].push(xmlElement);
    }
  });

  // Build spread structure
  const spreadData = {
    'idPkg:Spread': {
      $: {
        'xmlns:idPkg': 'http://ns.adobe.com/AdobeInDesign/idml/1.0/packaging',
        DOMVersion: '16.0',
      },
      Spread: [
        {
          $: {
            Self: spreadAttributes.Self || 'ub6',
            ItemTransform: spreadAttributes.ItemTransform || '1 0 0 1 0 0',
            PageCount: spreadAttributes.PageCount || '1',
            BindingLocation: spreadAttributes.BindingLocation || '1',
            ShowMasterItems: spreadAttributes.ShowMasterItems !== false,
            ...spreadAttributes,
          },
          // Elements are added in IDML spec order
          ...(grouped.TextFrame.length > 0 && { TextFrame: grouped.TextFrame }),
          ...(grouped.Rectangle.length > 0 && { Rectangle: grouped.Rectangle }),
          ...(grouped.GraphicLine.length > 0 && { GraphicLine: grouped.GraphicLine }),
          ...(grouped.Group.length > 0 && { Group: grouped.Group }),
          ...(grouped.Polygon.length > 0 && { Polygon: grouped.Polygon }),
          ...(grouped.Oval.length > 0 && { Oval: grouped.Oval }),
        },
      ],
    },
  };

  // Build XML
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8', standalone: true },
    renderOpts: { pretty: true, indent: '\t', newline: '\n' },
    headless: false,
  });

  const xml = builder.buildObject(spreadData);
  return xml;
}

/**
 * Convert IDML element to XML object structure
 */
function elementToXMLObject(element: IDMLElement): any {
  const xmlObj: any = {
    $: element.attributes,
  };

  // Add image if present
  if (element.image) {
    xmlObj.Image = [
      {
        $: {
          Self: `${element.attributes.Self}_image`,
          ItemTransform: '1 0 0 1 0 0',
        },
        Link: [
          {
            $: {
              Self: `${element.attributes.Self}_link`,
              LinkResourceURI: element.image.link,
            },
          },
        ],
        Properties: [
          {
            GeometricBounds: [
              {
                $: { type: 'list' },
                _: element.image.bounds,
              },
            ],
          },
        ],
      },
    ];
  }

  // Add children (for Groups)
  if (element.children && element.children.length > 0) {
    // Group children by type
    const childrenGrouped: Record<string, any[]> = {};

    element.children.forEach(child => {
      if (!childrenGrouped[child.type]) {
        childrenGrouped[child.type] = [];
      }

      const childXmlObj = elementToXMLObject(child);
      if (childXmlObj) {
        childrenGrouped[child.type].push(childXmlObj);
      }
    });

    // Add children in order
    Object.entries(childrenGrouped).forEach(([type, children]) => {
      xmlObj[type] = children;
    });
  }

  return xmlObj;
}

/**
 * Update existing Spread XML with modified elements
 */
export async function updateSpreadXML(
  originalXML: string,
  modifiedElements: IDMLElement[]
): Promise<string> {
  const parser = new xml2js.Parser();
  const spreadData = await parser.parseStringPromise(originalXML);

  const spread = spreadData['idPkg:Spread'].Spread[0];

  // Update or add each modified element
  modifiedElements.forEach(element => {
    const elementType = element.type;
    const elementId = element.attributes.Self;

    // Ensure array exists for this type
    if (!spread[elementType]) {
      spread[elementType] = [];
    }

    // Find existing element
    const existingIndex = spread[elementType].findIndex(
      (el: any) => el.$.Self === elementId
    );

    const xmlElement = elementToXMLObject(element);

    if (existingIndex >= 0) {
      // Update existing
      spread[elementType][existingIndex] = xmlElement;
      console.log(`Updated ${elementType} ${elementId} in spread`);
    } else {
      // Add new
      spread[elementType].push(xmlElement);
      console.log(`Added new ${elementType} ${elementId} to spread`);
    }
  });

  // Build XML
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8', standalone: true },
    renderOpts: { pretty: true, indent: '\t', newline: '\n' },
  });

  return builder.buildObject(spreadData);
}

/**
 * Remove deleted elements from Spread XML
 */
export async function removeElementsFromSpreadXML(
  originalXML: string,
  elementIdsToRemove: string[]
): Promise<string> {
  const parser = new xml2js.Parser();
  const spreadData = await parser.parseStringPromise(originalXML);

  const spread = spreadData['idPkg:Spread'].Spread[0];

  // Remove from each element type
  const elementTypes = ['TextFrame', 'Rectangle', 'GraphicLine', 'Group', 'Polygon', 'Oval'];

  elementTypes.forEach(type => {
    if (spread[type]) {
      spread[type] = spread[type].filter((el: any) => {
        const shouldRemove = elementIdsToRemove.includes(el.$.Self);
        if (shouldRemove) {
          console.log(`Removed ${type} ${el.$.Self} from spread`);
        }
        return !shouldRemove;
      });

      // Remove empty arrays
      if (spread[type].length === 0) {
        delete spread[type];
      }
    }
  });

  // Build XML
  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8', standalone: true },
    renderOpts: { pretty: true, indent: '\t', newline: '\n' },
  });

  return builder.buildObject(spreadData);
}

/**
 * Get spread attributes from XML
 */
export async function getSpreadAttributes(spreadXML: string): Promise<Record<string, any>> {
  const parser = new xml2js.Parser();
  const spreadData = await parser.parseStringPromise(spreadXML);

  return spreadData['idPkg:Spread'].Spread[0].$ || {};
}
