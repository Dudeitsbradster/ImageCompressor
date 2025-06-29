import { CompressionSettings } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Zap, Globe, Focus, Filter } from "lucide-react";

interface CompressionSettingsProps {
  settings: CompressionSettings;
  onChange: (settings: CompressionSettings) => void;
}

export default function CompressionSettingsComponent({ settings, onChange }: CompressionSettingsProps) {
  const handleQualityChange = (value: number) => {
    onChange({ ...settings, quality: value });
  };

  const handleModeChange = (mode: CompressionSettings['mode']) => {
    onChange({ ...settings, mode });
  };

  const handleToggle = (key: keyof CompressionSettings, value: boolean) => {
    onChange({ ...settings, [key]: value });
  };

  const getModeDescription = (mode: CompressionSettings['mode']) => {
    switch (mode) {
      case 'aggressive':
        return 'Maximum file size reduction with noise filtering and heavy optimization';
      case 'balanced':
        return 'Optimal balance of quality and file size with web optimization';
      case 'gentle':
        return 'Preserves maximum quality with edge sharpening for detailed images';
      default:
        return '';
    }
  };

  const getQualityRange = () => {
    const quality = settings.quality;
    if (quality >= 85) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (quality >= 70) return { label: 'High', color: 'bg-blue-100 text-blue-800' };
    if (quality >= 50) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', color: 'bg-red-100 text-red-800' };
  };

  const qualityRange = getQualityRange();

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-slate-900">Advanced JPEG Compression</span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">Enhanced Algorithm</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality Level */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-slate-700">Quality Level</Label>
            <div className="flex items-center space-x-2">
              <Badge className={qualityRange.color}>{qualityRange.label}</Badge>
              <span className="text-sm font-medium text-slate-600">{settings.quality}%</span>
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="range"
              min="10"
              max="95"
              value={settings.quality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="compression-slider"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Smallest file</span>
              <span>Balanced</span>
              <span>Highest quality</span>
            </div>
          </div>
        </div>

        {/* Compression Mode */}
        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-3">Compression Algorithm</Label>
          <RadioGroup value={settings.mode} onValueChange={handleModeChange} className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <RadioGroupItem value="balanced" id="balanced" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="balanced" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Balanced (Recommended)
                </Label>
                <p className="text-xs text-slate-500 mt-1">
                  Smart resizing with web optimization and contrast enhancement
                </p>
              </div>
              <Globe className="w-4 h-4 text-blue-500 mt-1" />
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <RadioGroupItem value="aggressive" id="aggressive" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="aggressive" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Maximum Compression
                </Label>
                <p className="text-xs text-slate-500 mt-1">
                  Heavy size reduction with noise filtering and bilateral smoothing
                </p>
              </div>
              <Zap className="w-4 h-4 text-amber-500 mt-1" />
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <RadioGroupItem value="gentle" id="gentle" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="gentle" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Gentle (High Quality)
                </Label>
                <p className="text-xs text-slate-500 mt-1">
                  Preserves detail with unsharp mask sharpening for professional images
                </p>
              </div>
              <Focus className="w-4 h-4 text-green-500 mt-1" />
            </div>
          </RadioGroup>
        </div>

        {/* Advanced Options */}
        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-4">Advanced Options</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-blue-500" />
                <div>
                  <Label className="text-sm font-medium text-slate-700">Web Optimization</Label>
                  <p className="text-xs text-slate-500">Enhanced contrast for web display</p>
                </div>
              </div>
              <Switch
                checked={settings.webOptimized || settings.mode !== 'gentle'}
                onCheckedChange={(checked) => handleToggle('webOptimized', checked)}
                disabled={settings.mode !== 'gentle'}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-3">
                <Focus className="w-4 h-4 text-green-500" />
                <div>
                  <Label className="text-sm font-medium text-slate-700">Edge Sharpening</Label>
                  <p className="text-xs text-slate-500">Unsharp mask for crisp details</p>
                </div>
              </div>
              <Switch
                checked={settings.sharpenFilter || (settings.mode === 'gentle' || settings.quality > 80)}
                onCheckedChange={(checked) => handleToggle('sharpenFilter', checked)}
                disabled={settings.mode === 'gentle' || settings.quality > 80}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-3">
                <Filter className="w-4 h-4 text-purple-500" />
                <div>
                  <Label className="text-sm font-medium text-slate-700">Noise Reduction</Label>
                  <p className="text-xs text-slate-500">Bilateral filtering for smoothing</p>
                </div>
              </div>
              <Switch
                checked={settings.noiseReduction || settings.mode === 'aggressive'}
                onCheckedChange={(checked) => handleToggle('noiseReduction', checked)}
                disabled={settings.mode === 'aggressive'}
              />
            </div>
          </div>
        </div>

        {/* Algorithm Description */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Current Algorithm:</h4>
          <p className="text-sm text-slate-600">{getModeDescription(settings.mode)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
