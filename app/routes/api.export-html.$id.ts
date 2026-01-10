import type { LoaderFunction } from '@remix-run/node';
import JSZip from 'jszip';
import { generateCSSFile, generatePackageInfo } from '~/lib/export/htmlGenerator';

/**
 * API endpoint to export as HTML+CSS
 *
 * GET /api/export-html/:id
 * Returns: ZIP file with HTML, CSS, and assets
 */

export const loader: LoaderFunction = async ({ params, request }) => {
  const { id } = params;

  if (!id) {
    return new Response('Missing upload ID', { status: 400 });
  }

  try {
    // Get canvas data from query params (would normally come from session/store)
    const url = new URL(request.url);
    const htmlContent = url.searchParams.get('html');
    const cssContent = url.searchParams.get('css');

    if (!htmlContent || !cssContent) {
      return new Response('Missing HTML/CSS data. Export from canvas first.', { status: 400 });
    }

    // Create ZIP
    const zip = new JSZip();

    // Add HTML file
    zip.file('index.html', htmlContent);

    // Add CSS file
    zip.file('styles.css', generateCSSFile(cssContent));

    // Add README
    zip.file('README.txt', `IDML HTML Export

This package contains an HTML/CSS export of your IDML document.

Files:
- index.html: Main HTML file
- styles.css: Stylesheet with absolute positioning
- assets/: Images and other resources

To view:
Open index.html in a web browser.

Note: This is a static representation and may not match InDesign's rendering exactly.
`);

    // Create assets directory
    zip.folder('assets');

    // Generate ZIP
    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    // Return as downloadable file
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="document_${id}_html.zip"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('HTML export error:', error);
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
