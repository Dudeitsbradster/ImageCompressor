import { ImageFile } from "@shared/schema";

export interface QualityMetrics {
  psnr: number; // Peak Signal-to-Noise Ratio
  ssim: number; // Structural Similarity Index
  mse: number; // Mean Squared Error
  sharpness: number; // Edge sharpness metric
  contrast: number; // Contrast level
  brightness: number; // Average brightness
  colorfulness: number; // Color saturation metric
  noiseLevel: number; // Estimated noise level
  fileEfficiency: number; // Compression efficiency score
  compressionRatio: number; // File size compression ratio
  overallQuality: number; // Combined quality score (0-100)
}

export interface VisualComparison {
  original: {
    imageData: ImageData;
    histogram: number[][];
    metrics: Partial<QualityMetrics>;
  };
  compressed: {
    imageData: ImageData;
    histogram: number[][];
    metrics: QualityMetrics;
  };
  difference: {
    imageData: ImageData;
    maxDifference: number;
    averageDifference: number;
  };
}

export class QualityAssessment {
  // Analyze image quality metrics
  static async analyzeImageQuality(
    originalFile: File,
    compressedBlob: Blob
  ): Promise<QualityMetrics> {
    const [originalData, compressedData] = await Promise.all([
      this.loadImageData(originalFile),
      this.loadImageData(compressedBlob)
    ]);

    const psnr = this.calculatePSNR(originalData, compressedData);
    const ssim = this.calculateSSIM(originalData, compressedData);
    const mse = this.calculateMSE(originalData, compressedData);
    const sharpness = this.calculateSharpness(compressedData);
    const contrast = this.calculateContrast(compressedData);
    const brightness = this.calculateBrightness(compressedData);
    const colorfulness = this.calculateColorfulness(compressedData);
    const noiseLevel = this.calculateNoiseLevel(compressedData);
    const fileEfficiency = this.calculateFileEfficiency(
      originalFile.size,
      compressedBlob.size,
      psnr
    );
    const compressionRatio = originalFile.size / compressedBlob.size;
    const overallQuality = this.calculateOverallQuality({
      psnr,
      ssim,
      sharpness,
      contrast,
      colorfulness,
      fileEfficiency
    });

    return {
      psnr,
      ssim,
      mse,
      sharpness,
      contrast,
      brightness,
      colorfulness,
      noiseLevel,
      fileEfficiency,
      compressionRatio,
      overallQuality
    };
  }

  // Create visual comparison data
  static async createVisualComparison(
    originalFile: File,
    compressedBlob: Blob
  ): Promise<VisualComparison> {
    const [originalData, compressedData] = await Promise.all([
      this.loadImageData(originalFile),
      this.loadImageData(compressedBlob)
    ]);

    const originalHistogram = this.calculateHistogram(originalData);
    const compressedHistogram = this.calculateHistogram(compressedData);
    const differenceData = this.calculateDifference(originalData, compressedData);

    const originalMetrics = {
      brightness: this.calculateBrightness(originalData),
      contrast: this.calculateContrast(originalData),
      sharpness: this.calculateSharpness(originalData),
      colorfulness: this.calculateColorfulness(originalData)
    };

    const compressedMetrics = await this.analyzeImageQuality(originalFile, compressedBlob);

    return {
      original: {
        imageData: originalData,
        histogram: originalHistogram,
        metrics: originalMetrics
      },
      compressed: {
        imageData: compressedData,
        histogram: compressedHistogram,
        metrics: compressedMetrics
      },
      difference: differenceData
    };
  }

  // Load image data from file or blob
  private static async loadImageData(source: File | Blob): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, img.width, img.height);
        URL.revokeObjectURL(img.src);
        if (imageData) {
          resolve(imageData);
        } else {
          reject(new Error('Failed to get image data'));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(source);
    });
  }

  // Calculate Peak Signal-to-Noise Ratio
  private static calculatePSNR(original: ImageData, compressed: ImageData): number {
    const mse = this.calculateMSE(original, compressed);
    if (mse === 0) return 100; // Perfect match
    return 20 * Math.log10(255 / Math.sqrt(mse));
  }

  // Calculate Mean Squared Error
  private static calculateMSE(original: ImageData, compressed: ImageData): number {
    const data1 = original.data;
    const data2 = compressed.data;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < data1.length; i += 4) {
      // Only compare RGB channels, skip alpha
      for (let j = 0; j < 3; j++) {
        const diff = data1[i + j] - data2[i + j];
        sum += diff * diff;
        count++;
      }
    }

    return sum / count;
  }

  // Calculate Structural Similarity Index (simplified version)
  private static calculateSSIM(original: ImageData, compressed: ImageData): number {
    const data1 = original.data;
    const data2 = compressed.data;
    
    // Calculate means
    let mean1 = 0, mean2 = 0;
    let count = 0;
    
    for (let i = 0; i < data1.length; i += 4) {
      const gray1 = (data1[i] + data1[i + 1] + data1[i + 2]) / 3;
      const gray2 = (data2[i] + data2[i + 1] + data2[i + 2]) / 3;
      mean1 += gray1;
      mean2 += gray2;
      count++;
    }
    
    mean1 /= count;
    mean2 /= count;
    
    // Calculate variances and covariance
    let var1 = 0, var2 = 0, covar = 0;
    
    for (let i = 0; i < data1.length; i += 4) {
      const gray1 = (data1[i] + data1[i + 1] + data1[i + 2]) / 3;
      const gray2 = (data2[i] + data2[i + 1] + data2[i + 2]) / 3;
      
      var1 += Math.pow(gray1 - mean1, 2);
      var2 += Math.pow(gray2 - mean2, 2);
      covar += (gray1 - mean1) * (gray2 - mean2);
    }
    
    var1 /= count;
    var2 /= count;
    covar /= count;
    
    // SSIM calculation
    const c1 = 6.5025, c2 = 58.5225; // Constants
    const numerator = (2 * mean1 * mean2 + c1) * (2 * covar + c2);
    const denominator = (mean1 * mean1 + mean2 * mean2 + c1) * (var1 + var2 + c2);
    
    return numerator / denominator;
  }

  // Calculate image sharpness using edge detection
  private static calculateSharpness(imageData: ImageData): number {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let sharpness = 0;
    let count = 0;

    // Sobel edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Convert to grayscale
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Sobel X and Y gradients
        const sobelX = 
          -1 * this.getGrayValue(data, x - 1, y - 1, width) +
           1 * this.getGrayValue(data, x + 1, y - 1, width) +
          -2 * this.getGrayValue(data, x - 1, y, width) +
           2 * this.getGrayValue(data, x + 1, y, width) +
          -1 * this.getGrayValue(data, x - 1, y + 1, width) +
           1 * this.getGrayValue(data, x + 1, y + 1, width);
           
        const sobelY = 
          -1 * this.getGrayValue(data, x - 1, y - 1, width) +
          -2 * this.getGrayValue(data, x, y - 1, width) +
          -1 * this.getGrayValue(data, x + 1, y - 1, width) +
           1 * this.getGrayValue(data, x - 1, y + 1, width) +
           2 * this.getGrayValue(data, x, y + 1, width) +
           1 * this.getGrayValue(data, x + 1, y + 1, width);
           
        const magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY);
        sharpness += magnitude;
        count++;
      }
    }

    return count > 0 ? (sharpness / count) / 255 : 0; // Normalize to 0-1
  }

  // Helper function to get grayscale value at coordinates
  private static getGrayValue(data: Uint8ClampedArray, x: number, y: number, width: number): number {
    const idx = (y * width + x) * 4;
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
  }

  // Calculate image contrast
  private static calculateContrast(imageData: ImageData): number {
    const data = imageData.data;
    let sum = 0;
    let count = 0;

    // Calculate mean
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += gray;
      count++;
    }
    const mean = sum / count;

    // Calculate standard deviation (contrast)
    let variance = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      variance += Math.pow(gray - mean, 2);
    }

    return Math.sqrt(variance / count) / 255; // Normalize to 0-1
  }

  // Calculate average brightness
  private static calculateBrightness(imageData: ImageData): number {
    const data = imageData.data;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += gray;
      count++;
    }

    return (sum / count) / 255; // Normalize to 0-1
  }

  // Calculate colorfulness metric
  private static calculateColorfulness(imageData: ImageData): number {
    const data = imageData.data;
    let rg = 0, yb = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      rg += Math.abs(r - g);
      yb += Math.abs((r + g) / 2 - b);
      count++;
    }

    const meanRG = rg / count;
    const meanYB = yb / count;
    
    // Calculate standard deviations
    let varRG = 0, varYB = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const rgDiff = Math.abs(r - g) - meanRG;
      const ybDiff = Math.abs((r + g) / 2 - b) - meanYB;
      
      varRG += rgDiff * rgDiff;
      varYB += ybDiff * ybDiff;
    }

    const stdRG = Math.sqrt(varRG / count);
    const stdYB = Math.sqrt(varYB / count);
    
    return Math.sqrt(stdRG * stdRG + stdYB * stdYB) / 255; // Normalize
  }

  // Calculate noise level estimation
  private static calculateNoiseLevel(imageData: ImageData): number {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let noise = 0;
    let count = 0;

    // Use Laplacian operator to detect noise
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const center = this.getGrayValue(data, x, y, width);
        const laplacian = 
          -1 * this.getGrayValue(data, x - 1, y - 1, width) +
          -1 * this.getGrayValue(data, x, y - 1, width) +
          -1 * this.getGrayValue(data, x + 1, y - 1, width) +
          -1 * this.getGrayValue(data, x - 1, y, width) +
           8 * center +
          -1 * this.getGrayValue(data, x + 1, y, width) +
          -1 * this.getGrayValue(data, x - 1, y + 1, width) +
          -1 * this.getGrayValue(data, x, y + 1, width) +
          -1 * this.getGrayValue(data, x + 1, y + 1, width);
          
        noise += Math.abs(laplacian);
        count++;
      }
    }

    return count > 0 ? (noise / count) / 255 : 0; // Normalize
  }

  // Calculate file compression efficiency
  private static calculateFileEfficiency(
    originalSize: number,
    compressedSize: number,
    psnr: number
  ): number {
    const compressionRatio = originalSize / compressedSize;
    const qualityFactor = Math.min(psnr / 40, 1); // Normalize PSNR to 0-1
    return (compressionRatio * qualityFactor) / 10; // Scale for readability
  }

  // Calculate overall quality score
  private static calculateOverallQuality(metrics: {
    psnr: number;
    ssim: number;
    sharpness: number;
    contrast: number;
    colorfulness: number;
    fileEfficiency: number;
  }): number {
    const weights = {
      psnr: 0.3,        // 30% - Most important for quality
      ssim: 0.25,       // 25% - Structural similarity
      sharpness: 0.2,   // 20% - Edge preservation
      contrast: 0.1,    // 10% - Contrast preservation
      colorfulness: 0.1, // 10% - Color preservation
      fileEfficiency: 0.05 // 5% - Compression efficiency
    };

    const normalizedPSNR = Math.min(metrics.psnr / 40, 1);
    const normalizedSSIM = Math.max(0, metrics.ssim);
    const normalizedSharpness = Math.min(metrics.sharpness * 2, 1);
    const normalizedContrast = Math.min(metrics.contrast * 2, 1);
    const normalizedColorfulness = Math.min(metrics.colorfulness * 2, 1);
    const normalizedEfficiency = Math.min(metrics.fileEfficiency / 2, 1);

    const score = 
      normalizedPSNR * weights.psnr +
      normalizedSSIM * weights.ssim +
      normalizedSharpness * weights.sharpness +
      normalizedContrast * weights.contrast +
      normalizedColorfulness * weights.colorfulness +
      normalizedEfficiency * weights.fileEfficiency;

    return Math.round(score * 100); // Convert to 0-100 scale
  }

  // Calculate color histogram
  private static calculateHistogram(imageData: ImageData): number[][] {
    const data = imageData.data;
    const histogram = [
      new Array(256).fill(0), // Red
      new Array(256).fill(0), // Green
      new Array(256).fill(0)  // Blue
    ];

    for (let i = 0; i < data.length; i += 4) {
      histogram[0][data[i]]++;     // Red
      histogram[1][data[i + 1]]++; // Green
      histogram[2][data[i + 2]]++; // Blue
    }

    return histogram;
  }

  // Calculate visual difference between images
  private static calculateDifference(
    original: ImageData,
    compressed: ImageData
  ): { imageData: ImageData; maxDifference: number; averageDifference: number } {
    const data1 = original.data;
    const data2 = compressed.data;
    const diffData = new ImageData(original.width, original.height);
    const diffArray = diffData.data;

    let maxDiff = 0;
    let totalDiff = 0;
    let count = 0;

    for (let i = 0; i < data1.length; i += 4) {
      const rDiff = Math.abs(data1[i] - data2[i]);
      const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
      const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
      
      const avgDiff = (rDiff + gDiff + bDiff) / 3;
      maxDiff = Math.max(maxDiff, avgDiff);
      totalDiff += avgDiff;
      count++;

      // Create difference visualization (amplified for visibility)
      const amplified = Math.min(avgDiff * 3, 255);
      diffArray[i] = amplified;     // Red
      diffArray[i + 1] = amplified; // Green
      diffArray[i + 2] = amplified; // Blue
      diffArray[i + 3] = 255;       // Alpha
    }

    return {
      imageData: diffData,
      maxDifference: maxDiff,
      averageDifference: totalDiff / count
    };
  }
}