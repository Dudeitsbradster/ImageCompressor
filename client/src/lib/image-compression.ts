import { CompressionSettings } from "@shared/schema";

export interface CompressionResult {
  blob: Blob;
  size: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
  actualQuality: number;
  compressionRatio: number;
}

export interface AdvancedCompressionSettings extends CompressionSettings {
  preserveMetadata?: boolean;
  sharpenFilter?: boolean;
  webOptimized?: boolean;
  progressiveJpeg?: boolean;
}

// Core compression function with advanced algorithms
export async function compressImage(
  file: File,
  settings: CompressionSettings,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { 
      alpha: false, // Better performance for JPEG
      willReadFrequently: false 
    });
    const img = new Image();

    img.onload = () => {
      try {
        onProgress?.(10);

        const originalDimensions = { width: img.width, height: img.height };
        
        // Enhanced dimension calculation with aspect ratio preservation
        const { width, height } = calculateOptimalDimensions(
          img.width, 
          img.height, 
          settings
        );

        canvas.width = width;
        canvas.height = height;

        onProgress?.(25);

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Apply web optimization filters
        if (isWebOptimized(settings)) {
          applyWebOptimizationFilters(ctx, width, height);
        }

        onProgress?.(40);

        // Advanced image drawing with smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = getImageSmoothingQuality(settings);
        
        // Apply sharpening filter if enabled
        if (shouldApplySharpenFilter(settings)) {
          drawImageWithSharpening(ctx, img, width, height);
        } else {
          ctx.drawImage(img, 0, 0, width, height);
        }

        onProgress?.(60);

        // Apply post-processing enhancements
        applyPostProcessingFilters(ctx, settings, width, height);

        onProgress?.(75);

        // Calculate optimized quality
        const quality = calculateAdvancedQuality(settings, originalDimensions, { width, height });

        onProgress?.(85);

        // Convert to blob with optimal encoding
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressionRatio = file.size / blob.size;
            
            onProgress?.(100);
            resolve({
              blob,
              size: blob.size,
              originalDimensions,
              compressedDimensions: { width, height },
              actualQuality: quality,
              compressionRatio
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

// Helper functions for advanced compression
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

function isWebOptimized(settings: CompressionSettings): boolean {
  return settings.mode === 'balanced' || settings.mode === 'aggressive';
}

function shouldApplySharpenFilter(settings: CompressionSettings): boolean {
  return settings.mode === 'gentle' || settings.quality > 80;
}

function getImageSmoothingQuality(settings: CompressionSettings): ImageSmoothingQuality {
  switch (settings.mode) {
    case 'aggressive':
      return 'low';
    case 'balanced':
      return 'medium';
    case 'gentle':
      return 'high';
    default:
      return 'medium';
  }
}

// Enhanced dimension calculation with smart resizing
function calculateOptimalDimensions(
  originalWidth: number, 
  originalHeight: number, 
  settings: CompressionSettings
): { width: number; height: number } {
  const maxSize = getMaxSize(settings.mode);
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  // Apply smart resizing based on image characteristics
  if (width > maxSize || height > maxSize) {
    if (width > height) {
      width = maxSize;
      height = Math.round(maxSize / aspectRatio);
    } else {
      height = maxSize;
      width = Math.round(maxSize * aspectRatio);
    }
  }
  
  // Ensure dimensions are even numbers for better JPEG encoding
  width = Math.round(width / 2) * 2;
  height = Math.round(height / 2) * 2;
  
  // Apply web optimization constraints
  if (isWebOptimized(settings)) {
    const webMaxSize = Math.min(maxSize, 1920); // Web-optimized max
    if (width > webMaxSize || height > webMaxSize) {
      const ratio = Math.min(webMaxSize / width, webMaxSize / height);
      width = Math.round(width * ratio / 2) * 2;
      height = Math.round(height * ratio / 2) * 2;
    }
  }
  
  return { width, height };
}

function applyWebOptimizationFilters(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number
): void {
  // Set optimal canvas settings for web
  ctx.imageSmoothingEnabled = true;
  
  // Apply slight contrast enhancement for web viewing
  ctx.filter = 'contrast(1.05) brightness(1.02)';
}

function drawImageWithSharpening(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
): void {
  // Draw the image
  ctx.drawImage(img, 0, 0, width, height);
  
  // Apply unsharp mask filter for better edge definition
  const imageData = ctx.getImageData(0, 0, width, height);
  const sharpened = applyUnsharpMask(imageData);
  ctx.putImageData(sharpened, 0, 0);
}

function applyUnsharpMask(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // Simple unsharp mask implementation
  const amount = 0.3; // Sharpening strength
  const threshold = 3; // Minimum difference for sharpening
  
  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    
    if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
      // Calculate Laplacian kernel for edge detection
      const center = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const neighbors = [
        (data[i - 4] + data[i - 3] + data[i - 2]) / 3, // left
        (data[i + 4] + data[i + 5] + data[i + 6]) / 3, // right
        (data[i - width * 4] + data[i - width * 4 + 1] + data[i - width * 4 + 2]) / 3, // top
        (data[i + width * 4] + data[i + width * 4 + 1] + data[i + width * 4 + 2]) / 3  // bottom
      ];
      
      const laplacian = 4 * center - neighbors.reduce((sum, val) => sum + val, 0);
      
      if (Math.abs(laplacian) > threshold) {
        outputData[i] = Math.max(0, Math.min(255, data[i] + amount * laplacian)); // R
        outputData[i + 1] = Math.max(0, Math.min(255, data[i + 1] + amount * laplacian)); // G
        outputData[i + 2] = Math.max(0, Math.min(255, data[i + 2] + amount * laplacian)); // B
      } else {
        outputData[i] = data[i];
        outputData[i + 1] = data[i + 1];
        outputData[i + 2] = data[i + 2];
      }
    } else {
      outputData[i] = data[i];
      outputData[i + 1] = data[i + 1];
      outputData[i + 2] = data[i + 2];
    }
    outputData[i + 3] = 255; // Alpha
  }
  
  return output;
}

function applyPostProcessingFilters(
  ctx: CanvasRenderingContext2D,
  settings: CompressionSettings,
  width: number,
  height: number
): void {
  if (settings.mode === 'aggressive') {
    // Apply noise reduction for aggressive compression
    const imageData = ctx.getImageData(0, 0, width, height);
    const filtered = applyNoiseReduction(imageData);
    ctx.putImageData(filtered, 0, 0);
  }
}

function applyNoiseReduction(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // Simple bilateral filter for noise reduction
  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    
    if (x > 1 && x < width - 2 && y > 1 && y < height - 2) {
      let rSum = 0, gSum = 0, bSum = 0, weightSum = 0;
      
      // 3x3 kernel
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          const weight = 1 / (1 + Math.abs(dx) + Math.abs(dy));
          
          rSum += data[idx] * weight;
          gSum += data[idx + 1] * weight;
          bSum += data[idx + 2] * weight;
          weightSum += weight;
        }
      }
      
      outputData[i] = Math.round(rSum / weightSum);
      outputData[i + 1] = Math.round(gSum / weightSum);
      outputData[i + 2] = Math.round(bSum / weightSum);
    } else {
      outputData[i] = data[i];
      outputData[i + 1] = data[i + 1];
      outputData[i + 2] = data[i + 2];
    }
    outputData[i + 3] = 255; // Alpha
  }
  
  return output;
}

function calculateAdvancedQuality(
  settings: CompressionSettings,
  originalDimensions: { width: number; height: number },
  compressedDimensions: { width: number; height: number }
): number {
  let baseQuality = settings.quality / 100;
  
  // Adjust quality based on compression mode
  switch (settings.mode) {
    case 'aggressive':
      baseQuality *= 0.75; // More aggressive reduction
      break;
    case 'gentle':
      baseQuality *= 1.15; // Increase quality for gentle mode
      baseQuality = Math.min(baseQuality, 0.98); // Cap at 98%
      break;
    default:
      baseQuality *= 0.9; // Slight reduction for balanced
      break;
  }
  
  // Adjust quality based on resize ratio
  const resizeRatio = (compressedDimensions.width * compressedDimensions.height) / 
                     (originalDimensions.width * originalDimensions.height);
  
  if (resizeRatio < 0.5) {
    // If heavily resized, can afford slightly lower quality
    baseQuality *= 0.95;
  } else if (resizeRatio > 0.9) {
    // If minimal resize, maintain higher quality
    baseQuality *= 1.05;
  }
  
  // Adjust for image complexity (estimated by dimensions)
  const pixelCount = compressedDimensions.width * compressedDimensions.height;
  if (pixelCount > 2000000) { // > 2MP
    baseQuality *= 0.95; // Slightly lower quality for large images
  } else if (pixelCount < 500000) { // < 0.5MP
    baseQuality *= 1.05; // Higher quality for small images
  }
  
  return Math.max(0.05, Math.min(0.98, baseQuality));
}