import { ImageFile, CompressionSettings } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-compression";
import { formatFileSize, downloadFile } from "@/lib/file-utils";
import { Combine, Trash2, Download, X, ImageIcon, Zap, Users, Eye, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { batchProcessor } from "@/lib/batch-processor";
import { QualityAssessment } from "@/lib/quality-assessment";
import QualityAssessmentPanel from "@/components/quality-assessment-panel";

// Image Preview Component with error handling
function ImagePreview({ file }: { file: ImageFile }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (file.file) {
      const url = URL.createObjectURL(file.file);
      setImageUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file.file]);

  const handleImageError = () => {
    setHasError(true);
  };

  if (hasError || !imageUrl) {
    return (
      <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
        <ImageIcon className="w-6 h-6 text-slate-400" />
      </div>
    );
  }

  return (
    <img 
      src={imageUrl}
      alt={`Preview of ${file.name}`}
      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
      onError={handleImageError}
      loading="lazy"
    />
  );
}

interface FilePreviewProps {
  files: ImageFile[];
  settings: CompressionSettings;
  onUpdateFile: (id: string, updates: Partial<ImageFile>) => void;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
}

export default function FilePreview({ 
  files, 
  settings, 
  onUpdateFile, 
  onRemoveFile, 
  onClearAll 
}: FilePreviewProps) {
  const { toast } = useToast();
  const [selectedFileForAssessment, setSelectedFileForAssessment] = useState<ImageFile | null>(null);

  const handleCompressFile = async (file: ImageFile) => {
    try {
      onUpdateFile(file.id, { status: 'compressing', progress: 0 });

      const result = await compressImage(
        file.file, 
        settings,
        (progress) => {
          onUpdateFile(file.id, { progress });
        }
      );

      const savings = file.originalSize - result.size;
      const savingsPercentage = Math.round((savings / file.originalSize) * 100);

      // Calculate quality metrics for compressed image
      let qualityScore = 0;
      let qualityGrade: ImageFile['qualityGrade'] = 'Fair';
      let psnr = 0;
      let ssim = 0;

      try {
        const qualityMetrics = await QualityAssessment.analyzeImageQuality(file.file, result.blob);
        qualityScore = qualityMetrics.overallQuality;
        psnr = qualityMetrics.psnr;
        ssim = qualityMetrics.ssim;
        
        if (qualityScore >= 90) qualityGrade = 'Excellent';
        else if (qualityScore >= 80) qualityGrade = 'Very Good';
        else if (qualityScore >= 70) qualityGrade = 'Good';
        else if (qualityScore >= 60) qualityGrade = 'Fair';
        else qualityGrade = 'Poor';
      } catch (error) {
        console.warn('Quality assessment failed:', error);
      }

      onUpdateFile(file.id, {
        status: 'compressed',
        compressedSize: result.size,
        compressedBlob: result.blob,
        savings,
        savingsPercentage,
        progress: 100,
        qualityScore,
        qualityGrade,
        psnr,
        ssim
      });

      toast({
        title: "Compression complete",
        description: `${file.name} compressed successfully. Saved ${savingsPercentage}% (${formatFileSize(savings)})`,
      });
    } catch (error) {
      console.error('Compression error:', error);
      onUpdateFile(file.id, { status: 'error', progress: 0 });
      toast({
        title: "Compression failed",
        description: `Failed to compress ${file.name}`,
        variant: "destructive",
      });
    }
  };

  const handleCompressAll = async () => {
    const filesToCompress = files.filter(f => f.status === 'ready');
    
    if (filesToCompress.length > 5) {
      // Use batch processor for large batches
      batchProcessor.addToQueue(filesToCompress, settings, 'normal');
      toast({
        title: "Batch processing started",
        description: `${filesToCompress.length} files added to processing queue.`,
      });
    } else {
      // Process small batches immediately
      for (const file of filesToCompress) {
        await handleCompressFile(file);
      }
    }
  };

  const handleBatchProcess = () => {
    const filesToCompress = files.filter(f => f.status === 'ready');
    batchProcessor.addToQueue(filesToCompress, settings, 'normal');
    toast({
      title: "Added to batch queue",
      description: `${filesToCompress.length} files queued for processing.`,
    });
  };

  const handleDownloadFile = (file: ImageFile) => {
    if (file.compressedBlob) {
      downloadFile(file.compressedBlob, file.name);
      toast({
        title: "Download started",
        description: `${file.name} is being downloaded.`,
      });
    } else {
      toast({
        title: "No compressed file available",
        description: "Please compress the image first before downloading.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: ImageFile['status']) => {
    switch (status) {
      case 'ready':
        return <Badge variant="secondary">Ready</Badge>;
      case 'compressing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Compressing</Badge>;
      case 'compressed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Compressed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Uploaded Files</h3>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleCompressAll}
            className="bg-primary hover:bg-blue-600 text-white"
            disabled={files.filter(f => f.status === 'ready').length === 0}
          >
            <Combine className="w-4 h-4 mr-2" />
            {files.filter(f => f.status === 'ready').length > 5 ? 'Queue All' : 'Compress All'}
          </Button>
          
          {files.filter(f => f.status === 'ready').length > 1 && (
            <Button 
              onClick={handleBatchProcess}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
              disabled={files.filter(f => f.status === 'ready').length === 0}
            >
              <Users className="w-4 h-4 mr-2" />
              Add to Queue
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={onClearAll}
            className="hover:bg-slate-100"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {files.map((file) => (
        <Card key={file.id} className="p-4">
          <div className="flex items-start space-x-4">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              <ImagePreview file={file} />
            </div>

            {/* File Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900 truncate">{file.name}</h4>
                {getStatusBadge(file.status)}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Original Size:</span>
                  <span className="font-medium ml-1">{formatFileSize(file.originalSize)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Compressed Size:</span>
                  <span className="font-medium ml-1">
                    {file.compressedSize ? formatFileSize(file.compressedSize) : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Savings:</span>
                  <span className="font-medium ml-1 text-green-600">
                    {file.savingsPercentage ? `${file.savingsPercentage}% (${formatFileSize(file.savings!)})` : '--'}
                  </span>
                </div>
              </div>

              {/* Quality Assessment */}
              {file.status === 'compressed' && file.qualityScore && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Quality Assessment</span>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        className={
                          file.qualityGrade === 'Excellent' ? 'bg-green-100 text-green-800' :
                          file.qualityGrade === 'Very Good' ? 'bg-blue-100 text-blue-800' :
                          file.qualityGrade === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                          file.qualityGrade === 'Fair' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {file.qualityGrade}
                      </Badge>
                      <span className="text-sm font-medium text-slate-700">{file.qualityScore}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>PSNR: {file.psnr?.toFixed(1)} dB</div>
                    <div>SSIM: {file.ssim?.toFixed(3)}</div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {file.status === 'compressing' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Compressing...</span>
                    <span>{file.progress}%</span>
                  </div>
                  <Progress value={file.progress} className="h-2" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 mt-3">
                {file.status === 'ready' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCompressFile(file)}
                    className="text-primary hover:text-blue-600"
                  >
                    <Combine className="w-4 h-4 mr-1" />
                    Combine
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(file.id)}
                  className="text-slate-500 hover:text-slate-600"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>

                {file.status === 'compressed' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadFile(file)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFileForAssessment(file)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Analyze Quality
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Quality Assessment Panel */}
      {selectedFileForAssessment && (
        <QualityAssessmentPanel
          file={selectedFileForAssessment}
          onClose={() => setSelectedFileForAssessment(null)}
        />
      )}
    </div>
  );
}
