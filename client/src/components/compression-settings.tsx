import { CompressionSettings } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Compression Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-3">Quality Level</Label>
            <div className="space-y-3">
              <input
                type="range"
                min="10"
                max="95"
                value={settings.quality}
                onChange={(e) => handleQualityChange(Number(e.target.value))}
                className="compression-slider"
              />
              <div className="flex justify-between text-sm text-slate-500">
                <span>Smaller file (10%)</span>
                <span className="font-medium">{settings.quality}%</span>
                <span>Better quality (95%)</span>
              </div>
            </div>
          </div>
          <div>
            <Label className="block text-sm font-medium text-slate-700 mb-3">Compression Mode</Label>
            <RadioGroup value={settings.mode} onValueChange={handleModeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balanced" id="balanced" />
                <Label htmlFor="balanced" className="text-sm text-slate-700">Balanced (Recommended)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="aggressive" id="aggressive" />
                <Label htmlFor="aggressive" className="text-sm text-slate-700">Maximum Compression</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gentle" id="gentle" />
                <Label htmlFor="gentle" className="text-sm text-slate-700">Gentle (High Quality)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
