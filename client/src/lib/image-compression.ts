import { CompressionSettings } from "@shared/schema";

export interface CompressionResult {
  blob: Blob;
  size: number;
}

export async function compressImage(
  file: File,
  settings: CompressionSettings,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        onProgress?.(20);

        // Calculate dimensions based on compression mode
        let { width, height } = img;
        const maxSize = getMaxSize(settings.mode);
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        onProgress?.(40);

        // Draw image on canvas
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(img, 0, 0, width, height);

        onProgress?.(70);

        // Calculate quality based on settings
        const quality = calculateQuality(settings);

        onProgress?.(90);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            onProgress?.(100);
            resolve({
              blob,
              size: blob.size
            });
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

function getMaxSize(mode: CompressionSettings['mode']): number {
  switch (mode) {
    case 'aggressive':
      return 1200;
    case 'balanced':
      return 1920;
    case 'gentle':
      return 2560;
    default:
      return 1920;
  }
}

function calculateQuality(settings: CompressionSettings): number {
  let baseQuality = settings.quality / 100;

  // Adjust quality based on mode
  switch (settings.mode) {
    case 'aggressive':
      baseQuality *= 0.8; // Reduce quality by 20%
      break;
    case 'gentle':
      baseQuality *= 1.1; // Increase quality by 10%
      baseQuality = Math.min(baseQuality, 0.95); // Cap at 95%
      break;
    default:
      // balanced - no adjustment
      break;
  }

  return Math.max(0.1, Math.min(0.95, baseQuality));
}
