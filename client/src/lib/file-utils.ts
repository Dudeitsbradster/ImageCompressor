import { ImageFile } from "@shared/schema";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function createImageFile(file: File): Promise<ImageFile> {
  // Validate file type more thoroughly
  const isJpeg = file.type === 'image/jpeg' || 
                file.type === 'image/jpg' || 
                file.name.toLowerCase().endsWith('.jpg') || 
                file.name.toLowerCase().endsWith('.jpeg');
  
  if (!isJpeg) {
    throw new Error('Only JPEG files are supported (.jpg, .jpeg)');
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB');
  }

  // Validate minimum file size (1KB to avoid empty files)
  if (file.size < 1024) {
    throw new Error('File is too small (minimum 1KB)');
  }

  // Additional validation - try to load the image to ensure it's valid
  await validateImageFile(file);

  return {
    id: generateId(),
    file,
    name: file.name,
    originalSize: file.size,
    status: 'ready',
    progress: 0
  };
}

async function validateImageFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      // Check minimum dimensions
      if (img.width < 50 || img.height < 50) {
        reject(new Error('Image dimensions too small (minimum 50x50 pixels)'));
        return;
      }
      // Check maximum dimensions
      if (img.width > 10000 || img.height > 10000) {
        reject(new Error('Image dimensions too large (maximum 10000x10000 pixels)'));
        return;
      }
      resolve();
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Invalid or corrupted image file'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/\.[^/.]+$/, '_compressed.jpg');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadAsZip(files: ImageFile[]): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  // Add compressed files to ZIP
  for (const file of files) {
    if (file.compressedBlob) {
      const filename = file.name.replace(/\.[^/.]+$/, '_compressed.jpg');
      zip.file(filename, file.compressedBlob);
    }
  }
  
  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  // Download ZIP file
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compressed_images_${new Date().getTime()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
