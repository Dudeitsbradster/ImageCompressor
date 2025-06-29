import { useState } from "react";
import { ImageFile, CompressionSettings } from "@shared/schema";
import UploadZone from "@/components/upload-zone";
import CompressionSettingsComponent from "@/components/compression-settings";
import FilePreview from "@/components/file-preview";
import BulkActions from "@/components/bulk-actions";
import { Combine, Shield, Zap, Wand2 } from "lucide-react";

export default function Home() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 80,
    mode: 'balanced',
    webOptimized: true,
    sharpenFilter: false,
    noiseReduction: false
  });

  const addFiles = (newFiles: ImageFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const updateFile = (id: string, updates: Partial<ImageFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const compressedFiles = files.filter(file => file.status === 'compressed');
  const totalSavings = compressedFiles.reduce((sum, file) => sum + (file.savings || 0), 0);
  const totalSavingsPercentage = compressedFiles.length > 0 
    ? Math.round(compressedFiles.reduce((sum, file) => sum + (file.savingsPercentage || 0), 0) / compressedFiles.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Combine className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">JPEG Compressor</h1>
            </div>
            <div className="hidden sm:flex items-center space-x-4 text-sm text-slate-600">
              <span>Fast • Secure • Free</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Combine Your JPEG Images</h2>
            <p className="text-slate-600 text-lg">Reduce file size without losing quality. Upload multiple images and compress them instantly.</p>
          </div>

          <UploadZone onFilesAdded={addFiles} />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-2xl font-bold text-blue-600">{files.length}</div>
              <div className="text-sm text-slate-600">Files Uploaded</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-2xl font-bold text-green-600">{compressedFiles.length}</div>
              <div className="text-sm text-slate-600">Compressed</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-2xl font-bold text-amber-600">{totalSavingsPercentage}%</div>
              <div className="text-sm text-slate-600">Average Savings</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-2xl font-bold text-purple-600">{Math.round(totalSavings / 1024)}KB</div>
              <div className="text-sm text-slate-600">Total Saved</div>
            </div>
          </div>
        </div>

        {/* Compression Settings */}
        {files.length > 0 && (
          <CompressionSettingsComponent 
            settings={settings} 
            onChange={setSettings} 
          />
        )}

        {/* File Preview Grid */}
        {files.length > 0 && (
          <FilePreview 
            files={files}
            settings={settings}
            onUpdateFile={updateFile}
            onRemoveFile={removeFile}
            onClearAll={clearAll}
          />
        )}

        {/* Bulk Actions */}
        {compressedFiles.length > 0 && (
          <BulkActions 
            filesProcessed={compressedFiles.length}
            totalSavings={totalSavings}
            totalSavingsPercentage={totalSavingsPercentage}
            compressedFiles={compressedFiles}
            onStartNew={clearAll}
          />
        )}

        {/* Feature Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-primary w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">100% Secure</h3>
            <p className="text-slate-600 text-sm">All processing happens in your browser. Your images never leave your device.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="text-primary w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Lightning Fast</h3>
            <p className="text-slate-600 text-sm">Client-side compression for instant results without waiting for uploads.</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wand2 className="text-primary w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Smart Compression</h3>
            <p className="text-slate-600 text-sm">Advanced algorithms maintain image quality while maximizing file size reduction.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>&copy; 2024 JPEG Compressor. Built with modern web technologies for optimal performance.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
