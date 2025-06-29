import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageFile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { createImageFile } from "@/lib/file-utils";
import { CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadZoneProps {
  onFilesAdded: (files: ImageFile[]) => void;
}

export default function UploadZone({ onFilesAdded }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setIsDragActive(false);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      toast({
        title: "Some files were rejected",
        description: "Only JPEG files under 10MB are accepted.",
        variant: "destructive",
      });
    }

    // Process accepted files
    if (acceptedFiles.length > 0) {
      const imageFiles: ImageFile[] = [];
      
      for (const file of acceptedFiles) {
        try {
          const imageFile = await createImageFile(file);
          imageFiles.push(imageFile);
        } catch (error) {
          console.error('Error creating image file:', error);
          toast({
            title: "Error processing file",
            description: `Failed to process ${file.name}`,
            variant: "destructive",
          });
        }
      }

      if (imageFiles.length > 0) {
        onFilesAdded(imageFiles);
        toast({
          title: "Files uploaded successfully",
          description: `${imageFiles.length} file(s) ready for compression.`,
        });
      }
    }
  }, [onFilesAdded, toast]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 50,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl p-12 text-center bg-white transition-all duration-300 cursor-pointer group ${
        isDragActive 
          ? 'border-primary bg-blue-50' 
          : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
          isDragActive 
            ? 'bg-blue-200' 
            : 'bg-blue-100 group-hover:bg-blue-200'
        }`}>
          <CloudUpload className="text-2xl text-primary w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {isDragActive ? 'Drop your files here' : 'Drop your JPEG files here'}
          </h3>
          <p className="text-slate-500 mb-4">or click to browse from your device</p>
          <Button 
            type="button"
            className="bg-primary hover:bg-blue-600 text-white px-6 py-3 font-medium"
          >
            Choose Files
          </Button>
        </div>
      </div>
      <input {...getInputProps()} />
    </div>
  );
}
