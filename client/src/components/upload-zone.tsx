import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageFile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { createImageFile } from "@/lib/file-utils";
import { CloudUpload, FileImage, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadZoneProps {
  onFilesAdded: (files: ImageFile[]) => void;
}

export default function UploadZone({ onFilesAdded }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setIsDragActive(false);
    setIsProcessing(true);
    
    // Handle rejected files with detailed error messages
    if (rejectedFiles.length > 0) {
      const errorReasons = rejectedFiles.map(rejection => {
        const errors = rejection.errors.map((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              return 'File too large (max 10MB)';
            case 'file-invalid-type':
              return 'Invalid file type (JPEG only)';
            case 'too-many-files':
              return 'Too many files (max 50)';
            default:
              return error.message;
          }
        });
        return `${rejection.file.name}: ${errors.join(', ')}`;
      });
      
      toast({
        title: `${rejectedFiles.length} file(s) rejected`,
        description: errorReasons.slice(0, 3).join('\n') + (errorReasons.length > 3 ? '\n...' : ''),
        variant: "destructive",
      });
    }

    // Process accepted files
    if (acceptedFiles.length > 0) {
      const imageFiles: ImageFile[] = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (const file of acceptedFiles) {
        try {
          const imageFile = await createImageFile(file);
          imageFiles.push(imageFile);
          successCount++;
        } catch (error) {
          console.error('Error creating image file:', error);
          errorCount++;
          toast({
            title: "Error processing file",
            description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      }

      if (imageFiles.length > 0) {
        onFilesAdded(imageFiles);
        toast({
          title: "Files uploaded successfully",
          description: `${successCount} file(s) ready for compression${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`,
        });
      }
    }
    
    setIsProcessing(false);
  }, [onFilesAdded, toast]);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 50,
    multiple: true,
    noClick: false,
    disabled: isProcessing,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl p-12 text-center bg-white transition-all duration-300 cursor-pointer group ${
        isProcessing 
          ? 'border-yellow-400 bg-yellow-50 cursor-wait' 
          : isDragActive 
            ? 'border-primary bg-blue-50' 
            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
      } ${isProcessing ? 'pointer-events-none' : ''}`}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
          isProcessing
            ? 'bg-yellow-200'
            : isDragActive 
              ? 'bg-blue-200' 
              : 'bg-blue-100 group-hover:bg-blue-200'
        }`}>
          {isProcessing ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : (
            <CloudUpload className="text-2xl text-primary w-8 h-8" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {isProcessing 
              ? 'Processing files...' 
              : isDragActive 
                ? 'Drop your files here' 
                : 'Drop your JPEG files here'}
          </h3>
          <p className="text-slate-500 mb-4">
            {isProcessing 
              ? 'Please wait while we process your images' 
              : 'or click to browse from your device'}
          </p>
          <Button 
            type="button"
            disabled={isProcessing}
            onClick={open}
            className="bg-primary hover:bg-blue-600 text-white px-6 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Choose Files'}
          </Button>
        </div>
      </div>
      
      {/* File requirements info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
        <div className="flex items-center justify-center space-x-2">
          <FileImage className="w-4 h-4 text-blue-500" />
          <span>JPEG files only</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Max 10MB per file</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <CloudUpload className="w-4 h-4 text-green-500" />
          <span>Up to 50 files</span>
        </div>
      </div>
      
      <input {...getInputProps()} />
    </div>
  );
}
