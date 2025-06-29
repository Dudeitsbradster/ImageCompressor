import { ImageFile } from "@shared/schema";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function createImageFile(file: File): Promise<ImageFile> {
  // Validate file type
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    throw new Error('Only JPEG files are supported');
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB');
  }

  return {
    id: generateId(),
    file,
    name: file.name,
    originalSize: file.size,
    status: 'ready',
    progress: 0
  };
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
  // We'll use a simple approach since JSZip isn't installed
  // For now, download files individually with a delay
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.compressedBlob) {
      downloadFile(file.compressedBlob, file.name);
      // Add a small delay between downloads
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
