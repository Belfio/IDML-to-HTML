/**
 * Image Uploader: Handle image uploads and replacement in Rectangle frames
 *
 * Key Responsibilities:
 * - Upload images to server
 * - Load images onto canvas
 * - Replace images in Rectangle frames
 * - Handle image scaling and cropping
 */

export interface ImageUploadResult {
  success: boolean;
  imageId?: string;
  url?: string;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Upload image file to server
 */
export async function uploadImage(
  file: File,
  uploadId: string
): Promise<ImageUploadResult> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('uploadId', uploadId);

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Load image from URL and get dimensions
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      resolve(img);
    };

    img.onerror = (error) => {
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculate scaled dimensions to fit image in frame
 */
export function calculateScaledDimensions(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  fitMode: 'fill' | 'fit' | 'stretch' = 'fill'
): { width: number; height: number; left: number; top: number } {
  const imageAspect = imageWidth / imageHeight;
  const frameAspect = frameWidth / frameHeight;

  let width: number, height: number, left: number, top: number;

  switch (fitMode) {
    case 'fit':
      // Fit entire image in frame (may have letterboxing)
      if (imageAspect > frameAspect) {
        width = frameWidth;
        height = frameWidth / imageAspect;
        left = 0;
        top = (frameHeight - height) / 2;
      } else {
        height = frameHeight;
        width = frameHeight * imageAspect;
        left = (frameWidth - width) / 2;
        top = 0;
      }
      break;

    case 'fill':
      // Fill frame with image (may crop)
      if (imageAspect > frameAspect) {
        height = frameHeight;
        width = frameHeight * imageAspect;
        left = (frameWidth - width) / 2;
        top = 0;
      } else {
        width = frameWidth;
        height = frameWidth / imageAspect;
        left = 0;
        top = (frameHeight - height) / 2;
      }
      break;

    case 'stretch':
      // Stretch to fill frame (may distort)
      width = frameWidth;
      height = frameHeight;
      left = 0;
      top = 0;
      break;
  }

  return { width, height, left, top };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, GIF, WebP, or SVG.',
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
}

/**
 * Create data URL from file
 */
export function createDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
