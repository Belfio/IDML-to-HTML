import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

/**
 * API endpoint for image uploads
 *
 * POST /api/upload-image
 * Content-Type: multipart/form-data
 * Body: { image: File, uploadId: string }
 */

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const uploadId = formData.get('uploadId') as string;

    if (!image || !uploadId) {
      return json({ error: 'Missing image or uploadId' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(image.type)) {
      return json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      return json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    // Generate unique filename
    const ext = image.name.split('.').pop() || 'jpg';
    const imageId = randomBytes(16).toString('hex');
    const filename = `${imageId}.${ext}`;

    // Create images directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', uploadId);
    const imagesDir = path.join(uploadDir, 'images');

    try {
      await mkdir(imagesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, which is fine
    }

    // Save image file
    const imagePath = path.join(imagesDir, filename);
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(imagePath, buffer);

    // Get image dimensions (approximate - could use sharp or similar library for accuracy)
    // For now, return success without dimensions
    const imageUrl = `/uploads/${uploadId}/images/${filename}`;

    console.log(`Uploaded image: ${filename} to ${imagesDir}`);

    return json({
      success: true,
      imageId,
      url: imageUrl,
      filename,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    );
  }
};
