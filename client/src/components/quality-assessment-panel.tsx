import { useState, useEffect, useRef } from "react";
import { ImageFile } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  BarChart3, 
  Layers, 
  Zap, 
  Target, 
  Palette,
  Filter,
  TrendingUp,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { QualityAssessment, QualityMetrics, VisualComparison } from "@/lib/quality-assessment";
import { formatFileSize } from "@/lib/file-utils";

interface QualityAssessmentPanelProps {
  file: ImageFile;
  onClose: () => void;
}

export default function QualityAssessmentPanel({ file, onClose }: QualityAssessmentPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null);
  const [visualComparison, setVisualComparison] = useState<VisualComparison | null>(null);
  const [activeView, setActiveView] = useState<'side-by-side' | 'overlay' | 'difference'>('side-by-side');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showHistogram, setShowHistogram] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const compressedCanvasRef = useRef<HTMLCanvasElement>(null);
  const differenceCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (file.compressedBlob) {
      analyzeQuality();
    }
  }, [file]);

  const analyzeQuality = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!file.compressedBlob) {
        throw new Error('No compressed image available for analysis');
      }

      const [metrics, comparison] = await Promise.all([
        QualityAssessment.analyzeImageQuality(file.file, file.compressedBlob),
        QualityAssessment.createVisualComparison(file.file, file.compressedBlob)
      ]);

      setQualityMetrics(metrics);
      setVisualComparison(comparison);
      
      // Render initial canvases
      renderCanvases(comparison);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image quality');
    } finally {
      setLoading(false);
    }
  };

  const renderCanvases = (comparison: VisualComparison) => {
    // Render original image
    if (originalCanvasRef.current) {
      const canvas = originalCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = comparison.original.imageData.width;
        canvas.height = comparison.original.imageData.height;
        ctx.putImageData(comparison.original.imageData, 0, 0);
      }
    }

    // Render compressed image
    if (compressedCanvasRef.current) {
      const canvas = compressedCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = comparison.compressed.imageData.width;
        canvas.height = comparison.compressed.imageData.height;
        ctx.putImageData(comparison.compressed.imageData, 0, 0);
      }
    }

    // Render difference map
    if (differenceCanvasRef.current) {
      const canvas = differenceCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = comparison.difference.imageData.width;
        canvas.height = comparison.difference.imageData.height;
        ctx.putImageData(comparison.difference.imageData, 0, 0);
      }
    }
  };

  const getQualityGrade = (score: number): { grade: string; color: string } => {
    if (score >= 90) return { grade: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { grade: 'Very Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { grade: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 60) return { grade: 'Fair', color: 'bg-orange-100 text-orange-800' };
    return { grade: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  const MetricCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    color = "text-slate-600" 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    color?: string; 
  }) => (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className="flex items-center space-x-3 mb-2">
        <div className={`${color}`}>{icon}</div>
        <span className="text-sm font-medium text-slate-700">{title}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );

  const HistogramChart = ({ histogram, title, color }: { 
    histogram: number[]; 
    title: string; 
    color: string; 
  }) => {
    const max = Math.max(...histogram);
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <div className="h-16 bg-slate-50 rounded flex items-end justify-center">
          {histogram.map((value, index) => {
            if (index % 4 !== 0) return null; // Sample every 4th value for performance
            const height = (value / max) * 100;
            return (
              <div
                key={index}
                className={`w-1 ${color} opacity-70`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-slate-600">Analyzing image quality...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-red-600">Analysis Error</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">{error}</p>
          <Button onClick={analyzeQuality} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!qualityMetrics || !visualComparison) {
    return null;
  }

  const qualityGrade = getQualityGrade(qualityMetrics.overallQuality);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full h-full max-w-7xl max-h-[90vh] overflow-hidden bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <span>Visual Quality Assessment</span>
                <Badge className={qualityGrade.color}>
                  {qualityGrade.grade} ({qualityMetrics.overallQuality}%)
                </Badge>
              </CardTitle>
              <p className="text-sm text-slate-600 truncate">{file.name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistogram(!showHistogram)}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-auto h-full">
          <Tabs defaultValue="comparison" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison">Visual Comparison</TabsTrigger>
              <TabsTrigger value="metrics">Quality Metrics</TabsTrigger>
              <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-6">
              {/* View Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={activeView === 'side-by-side' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('side-by-side')}
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    Side by Side
                  </Button>
                  <Button
                    variant={activeView === 'overlay' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('overlay')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Overlay
                  </Button>
                  <Button
                    variant={activeView === 'difference' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveView('difference')}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Difference Map
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.max(0.25, zoomLevel - 0.25))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-slate-600 w-16 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.25))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(1)}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Image Comparison */}
              <div className="border rounded-lg overflow-hidden bg-slate-50">
                {activeView === 'side-by-side' && (
                  <div className="grid grid-cols-2 gap-0">
                    <div className="border-r border-slate-200">
                      <div className="bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                        Original ({formatFileSize(file.originalSize)})
                      </div>
                      <div className="p-4 overflow-auto" style={{ maxHeight: '400px' }}>
                        <canvas
                          ref={originalCanvasRef}
                          className="max-w-full h-auto border border-slate-200"
                          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                        Compressed ({formatFileSize(file.compressedSize || 0)})
                      </div>
                      <div className="p-4 overflow-auto" style={{ maxHeight: '400px' }}>
                        <canvas
                          ref={compressedCanvasRef}
                          className="max-w-full h-auto border border-slate-200"
                          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeView === 'difference' && (
                  <div>
                    <div className="bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                      Difference Map (Amplified 3x)
                    </div>
                    <div className="p-4 flex justify-center overflow-auto" style={{ maxHeight: '400px' }}>
                      <canvas
                        ref={differenceCanvasRef}
                        className="max-w-full h-auto border border-slate-200"
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                      />
                    </div>
                    <div className="px-4 pb-4 text-xs text-slate-500 text-center">
                      Max Difference: {visualComparison.difference.maxDifference.toFixed(1)} | 
                      Average: {visualComparison.difference.averageDifference.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* File Size Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={<Download className="w-5 h-5" />}
                  title="Original Size"
                  value={formatFileSize(file.originalSize)}
                  subtitle="Uncompressed"
                  color="text-blue-600"
                />
                <MetricCard
                  icon={<Zap className="w-5 h-5" />}
                  title="Compressed Size"
                  value={formatFileSize(file.compressedSize || 0)}
                  subtitle={`${file.savingsPercentage || 0}% reduction`}
                  color="text-green-600"
                />
                <MetricCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  title="Compression Ratio"
                  value={`${qualityMetrics.compressionRatio.toFixed(1)}:1`}
                  subtitle="Size reduction factor"
                  color="text-purple-600"
                />
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              {/* Quality Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  icon={<Target className="w-5 h-5" />}
                  title="PSNR"
                  value={`${qualityMetrics.psnr.toFixed(1)} dB`}
                  subtitle="Peak Signal-to-Noise Ratio"
                  color="text-blue-600"
                />
                <MetricCard
                  icon={<Eye className="w-5 h-5" />}
                  title="SSIM"
                  value={qualityMetrics.ssim.toFixed(3)}
                  subtitle="Structural Similarity"
                  color="text-green-600"
                />
                <MetricCard
                  icon={<Filter className="w-5 h-5" />}
                  title="Sharpness"
                  value={`${(qualityMetrics.sharpness * 100).toFixed(1)}%`}
                  subtitle="Edge definition"
                  color="text-purple-600"
                />
                <MetricCard
                  icon={<Palette className="w-5 h-5" />}
                  title="Colorfulness"
                  value={`${(qualityMetrics.colorfulness * 100).toFixed(1)}%`}
                  subtitle="Color saturation"
                  color="text-orange-600"
                />
              </div>

              {/* Quality Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700">Overall Quality Score</span>
                    <span className="font-medium">{qualityMetrics.overallQuality}%</span>
                  </div>
                  <Progress value={qualityMetrics.overallQuality} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700">Brightness</span>
                    <span className="font-medium">{(qualityMetrics.brightness * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={qualityMetrics.brightness * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700">Contrast</span>
                    <span className="font-medium">{(qualityMetrics.contrast * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={qualityMetrics.contrast * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-700">Noise Level</span>
                    <span className="font-medium">{(qualityMetrics.noiseLevel * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={qualityMetrics.noiseLevel * 100} className="h-2" />
                </div>
              </div>

              {/* Histogram Comparison */}
              {showHistogram && visualComparison && (
                <div className="space-y-4">
                  <Separator />
                  <h3 className="text-lg font-semibold text-slate-900">Color Histograms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">Original</h4>
                      <HistogramChart 
                        histogram={visualComparison.original.histogram[0]} 
                        title="Red Channel" 
                        color="bg-red-400" 
                      />
                      <HistogramChart 
                        histogram={visualComparison.original.histogram[1]} 
                        title="Green Channel" 
                        color="bg-green-400" 
                      />
                      <HistogramChart 
                        histogram={visualComparison.original.histogram[2]} 
                        title="Blue Channel" 
                        color="bg-blue-400" 
                      />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">Compressed</h4>
                      <HistogramChart 
                        histogram={visualComparison.compressed.histogram[0]} 
                        title="Red Channel" 
                        color="bg-red-400" 
                      />
                      <HistogramChart 
                        histogram={visualComparison.compressed.histogram[1]} 
                        title="Green Channel" 
                        color="bg-green-400" 
                      />
                      <HistogramChart 
                        histogram={visualComparison.compressed.histogram[2]} 
                        title="Blue Channel" 
                        color="bg-blue-400" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {/* Detailed Analysis */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Quality Analysis Report</h3>
                
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge className={qualityGrade.color}>
                      {qualityGrade.grade}
                    </Badge>
                    <span className="text-sm text-slate-600">
                      Overall Quality Score: {qualityMetrics.overallQuality}/100
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-700 space-y-2">
                    <p>
                      <strong>Image Fidelity:</strong> The PSNR of {qualityMetrics.psnr.toFixed(1)} dB 
                      indicates {qualityMetrics.psnr > 35 ? 'excellent' : qualityMetrics.psnr > 30 ? 'good' : 'acceptable'} 
                      preservation of image quality relative to noise.
                    </p>
                    
                    <p>
                      <strong>Structural Integrity:</strong> SSIM score of {qualityMetrics.ssim.toFixed(3)} 
                      shows {qualityMetrics.ssim > 0.9 ? 'excellent' : qualityMetrics.ssim > 0.8 ? 'good' : 'moderate'} 
                      preservation of image structure and texture.
                    </p>
                    
                    <p>
                      <strong>Detail Preservation:</strong> Sharpness metric of {(qualityMetrics.sharpness * 100).toFixed(1)}% 
                      indicates {qualityMetrics.sharpness > 0.3 ? 'well-preserved' : 'somewhat reduced'} edge definition.
                    </p>
                    
                    <p>
                      <strong>Compression Efficiency:</strong> Achieved {file.savingsPercentage}% size reduction 
                      with a {qualityMetrics.fileEfficiency.toFixed(1)} efficiency rating.
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    {qualityMetrics.overallQuality >= 85 && (
                      <p>• Excellent quality achieved. This compression setting is optimal for this image.</p>
                    )}
                    {qualityMetrics.overallQuality < 70 && (
                      <p>• Consider using a higher quality setting to improve image fidelity.</p>
                    )}
                    {qualityMetrics.sharpness < 0.2 && (
                      <p>• Enable sharpening filter to preserve edge details.</p>
                    )}
                    {qualityMetrics.noiseLevel > 0.3 && (
                      <p>• Apply noise reduction to improve visual quality.</p>
                    )}
                    {file.savingsPercentage && file.savingsPercentage < 30 && (
                      <p>• Try a more aggressive compression mode for better file size reduction.</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}