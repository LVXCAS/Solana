import { access, stat } from 'fs/promises';
import { extname } from 'path';

/**
 * Result of image path validation
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an image file path for IPFS upload
 * @param imagePath Path to image file
 * @returns Validation result with error message if invalid
 */
export async function validateImagePath(imagePath: string): Promise<ValidationResult> {
  try {
    // Check 1: File exists
    try {
      await access(imagePath);
    } catch {
      return {
        valid: false,
        error: `File not found: ${imagePath}`,
      };
    }

    // Check 2: Valid image extension
    const ext = extname(imagePath).toLowerCase();
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

    if (!validExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Invalid image format: ${ext}. Supported: ${validExtensions.join(', ')}`,
      };
    }

    // Check 3: File size under 10MB (Pinata free tier limit)
    const stats = await stat(imagePath);
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes

    if (stats.size > maxSize) {
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `Image too large: ${sizeMB}MB. Maximum: 10MB (Pinata free tier limit)`,
      };
    }

    // All checks passed
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: `Validation error: ${error.message}`,
    };
  }
}
