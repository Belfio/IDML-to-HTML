import JSZip from 'jszip';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

/**
 * IDML Packer: Rebuild IDML ZIP archive
 *
 * Key Responsibilities:
 * - Repack extracted IDML directory to ZIP
 * - Include all required files (mimetype, META-INF, Spreads, Stories, Resources)
 * - Maintain proper ZIP structure
 * - Handle updated XML files
 */

/**
 * Pack extracted IDML directory back into ZIP
 */
export async function packIDML(extractedDir: string): Promise<Buffer> {
  const zip = new JSZip();

  // Add mimetype file (must be first, uncompressed)
  const mimetypePath = path.join(extractedDir, 'mimetype');
  try {
    const mimetypeContent = await readFile(mimetypePath, 'utf-8');
    zip.file('mimetype', mimetypeContent, { compression: 'STORE' });
  } catch (error) {
    // If mimetype doesn't exist, create it
    zip.file('mimetype', 'application/vnd.adobe.indesign-idml-package', { compression: 'STORE' });
  }

  // Add all other files
  await addDirectoryToZip(zip, extractedDir, '');

  // Generate ZIP buffer
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return buffer;
}

/**
 * Recursively add directory contents to ZIP
 */
async function addDirectoryToZip(
  zip: JSZip,
  dirPath: string,
  zipPath: string
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const zipFilePath = zipPath ? `${zipPath}/${entry.name}` : entry.name;

    // Skip mimetype (already added)
    if (entry.name === 'mimetype') {
      continue;
    }

    // Skip hidden files and directories
    if (entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively add directory
      await addDirectoryToZip(zip, fullPath, zipFilePath);
    } else if (entry.isFile()) {
      // Add file
      const content = await readFile(fullPath);
      zip.file(zipFilePath, content);
    }
  }
}

/**
 * Pack IDML with updated spread XML
 */
export async function packIDMLWithSpread(
  extractedDir: string,
  spreadFile: string,
  spreadXML: string
): Promise<Buffer> {
  const zip = new JSZip();

  // Add mimetype
  zip.file('mimetype', 'application/vnd.adobe.indesign-idml-package', { compression: 'STORE' });

  // Add all files except the spread being updated
  await addDirectoryToZipExcept(zip, extractedDir, '', [`Spreads/${spreadFile}`]);

  // Add updated spread
  zip.file(`Spreads/${spreadFile}`, spreadXML);

  // Generate ZIP
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return buffer;
}

/**
 * Add directory to ZIP excluding specific files
 */
async function addDirectoryToZipExcept(
  zip: JSZip,
  dirPath: string,
  zipPath: string,
  excludePaths: string[]
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const zipFilePath = zipPath ? `${zipPath}/${entry.name}` : entry.name;

    // Skip if in exclude list
    if (excludePaths.includes(zipFilePath) || entry.name === 'mimetype' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory()) {
      await addDirectoryToZipExcept(zip, fullPath, zipFilePath, excludePaths);
    } else if (entry.isFile()) {
      const content = await readFile(fullPath);
      zip.file(zipFilePath, content);
    }
  }
}

/**
 * Validate IDML structure
 */
export async function validateIDMLStructure(extractedDir: string): Promise<{
  valid: boolean;
  missingFiles: string[];
}> {
  const requiredFiles = [
    'mimetype',
    'META-INF/container.xml',
    'designmap.xml',
  ];

  const requiredDirs = [
    'Spreads',
    'Stories',
    'Resources',
  ];

  const missingFiles: string[] = [];

  // Check required files
  for (const file of requiredFiles) {
    const filePath = path.join(extractedDir, file);
    try {
      await readFile(filePath);
    } catch {
      missingFiles.push(file);
    }
  }

  // Check required directories
  for (const dir of requiredDirs) {
    const dirPath = path.join(extractedDir, dir);
    try {
      await readdir(dirPath);
    } catch {
      missingFiles.push(`${dir}/`);
    }
  }

  return {
    valid: missingFiles.length === 0,
    missingFiles,
  };
}

/**
 * Get IDML package size
 */
export async function getIDMLSize(extractedDir: string): Promise<number> {
  let totalSize = 0;

  async function calculateSize(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await calculateSize(fullPath);
      } else if (entry.isFile()) {
        const stats = await import('fs/promises').then(fs => fs.stat(fullPath));
        totalSize += stats.size;
      }
    }
  }

  await calculateSize(extractedDir);
  return totalSize;
}
