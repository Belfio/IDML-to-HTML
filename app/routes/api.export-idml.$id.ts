import type { LoaderFunction } from '@remix-run/node';
import { readFile } from 'fs/promises';
import path from 'path';
import { packIDML } from '~/lib/export/idmlPacker';

/**
 * API endpoint to export modified IDML
 *
 * GET /api/export-idml/:id
 * Returns: IDML file (application/vnd.adobe.indesign-idml-package)
 */

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response('Missing upload ID', { status: 400 });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'uploads', id);
    const extractedDir = path.join(uploadDir, 'extracted');

    // Find original filename
    const files = await import('fs/promises').then(fs => fs.readdir(uploadDir));
    const originalFile = files.find(f => f.endsWith('.idml'));
    const filename = originalFile || `document_${id}.idml`;

    // Pack IDML
    console.log(`Packing IDML from ${extractedDir}...`);
    const buffer = await packIDML(extractedDir);

    console.log(`Successfully packed IDML: ${buffer.length} bytes`);

    // Return as downloadable file
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.adobe.indesign-idml-package',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('IDML export error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Export failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
