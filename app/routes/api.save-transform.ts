import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { readFile, writeFile } from 'fs/promises';
import * as xml2js from 'xml2js';
import path from 'path';

/**
 * API endpoint to save object transform modifications to Spread XML
 *
 * POST /api/save-transform
 * Body: {
 *   uploadId: string
 *   spreadIndex: number
 *   objectId: string (IDML Self ID)
 *   transform: string (IDML ItemTransform matrix)
 *   objectType: 'TextFrame' | 'Rectangle' | 'GraphicLine' | 'Group' | 'Polygon'
 * }
 */

interface SaveTransformRequest {
  uploadId: string;
  spreadIndex: number;
  objectId: string;
  transform: string;
  objectType: 'TextFrame' | 'Rectangle' | 'GraphicLine' | 'Group' | 'Polygon';
}

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body: SaveTransformRequest = await request.json();
    const { uploadId, spreadIndex, objectId, transform, objectType } = body;

    // Validate inputs
    if (!uploadId || spreadIndex === undefined || !objectId || !transform || !objectType) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'uploads', uploadId);
    const extractedDir = path.join(uploadDir, 'extracted');
    const spreadsDir = path.join(extractedDir, 'Spreads');

    // Get spread file
    const spreadFiles = await import('fs/promises').then(fs => fs.readdir(spreadsDir));
    const spreadFile = spreadFiles[spreadIndex];

    if (!spreadFile) {
      return json({ error: 'Spread file not found' }, { status: 404 });
    }

    const spreadPath = path.join(spreadsDir, spreadFile);

    // Read and parse spread XML
    const parser = new xml2js.Parser();
    const spreadXML = await readFile(spreadPath, 'utf-8');
    const spreadData = await parser.parseStringPromise(spreadXML);

    // Find and update the object
    const spread = spreadData['idPkg:Spread'].Spread[0];
    let objectFound = false;

    // Helper function to update object in array
    const updateObjectInArray = (array: any[], typeName: string) => {
      if (!array) return;

      for (const obj of array) {
        if (obj.$.Self === objectId) {
          console.log(`Updating ${typeName} ${objectId} transform to: ${transform}`);
          obj.$.ItemTransform = transform;
          objectFound = true;
          break;
        }
      }
    };

    // Check direct children of spread
    updateObjectInArray(spread[objectType], objectType);

    // Check in pages if not found
    if (!objectFound && spread.Page) {
      for (const page of spread.Page) {
        updateObjectInArray(page[objectType], objectType);
        if (objectFound) break;
      }
    }

    // Check in groups (objects can be nested in groups)
    if (!objectFound && spread.Group) {
      for (const group of spread.Group) {
        updateObjectInArray(group[objectType], objectType);
        if (objectFound) break;
      }
    }

    if (!objectFound) {
      return json(
        { error: `Object ${objectId} not found in spread ${spreadIndex}` },
        { status: 404 }
      );
    }

    // Build XML back
    const builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8', standalone: true },
      renderOpts: { pretty: true, indent: '\t' },
    });
    const updatedXML = builder.buildObject(spreadData);

    // Write back to file
    await writeFile(spreadPath, updatedXML, 'utf-8');

    console.log(`Successfully saved transform for ${objectType} ${objectId} in spread ${spreadIndex}`);

    return json({
      success: true,
      message: 'Transform saved successfully',
      objectId,
      transform,
    });
  } catch (error) {
    console.error('Save transform error:', error);
    return json(
      {
        error: error instanceof Error ? error.message : 'Failed to save transform',
      },
      { status: 500 }
    );
  }
};
