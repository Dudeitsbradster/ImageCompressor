import { ImageFile } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatFileSize, downloadAsZip } from "@/lib/file-utils";
import { Download, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsProps {
  filesProcessed: number;
  totalSavings: number;
  totalSavingsPercentage: number;
  compressedFiles: ImageFile[];
  onStartNew: () => void;
}

export default function BulkActions({ 
  filesProcessed, 
  totalSavings, 
  totalSavingsPercentage,
  compressedFiles,
  onStartNew
}: BulkActionsProps) {
  const { toast } = useToast();

  const handleDownloadAll = async () => {
    try {
      await downloadAsZip(compressedFiles);
      toast({
        title: "Download started",
        description: "Your compressed images are being downloaded as a ZIP file.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to create ZIP file. Please try downloading files individually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mt-8">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Compression Complete!</h3>
            <p className="text-slate-600">
              <span className="font-medium">{filesProcessed}</span> files compressed • 
              Total savings: <span className="font-medium text-green-600">{totalSavingsPercentage}% ({formatFileSize(totalSavings)})</span>
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={handleDownloadAll}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All as ZIP
            </Button>
            <Button 
              variant="outline"
              onClick={onStartNew}
              className="border-slate-300 hover:bg-slate-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Compress More
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
