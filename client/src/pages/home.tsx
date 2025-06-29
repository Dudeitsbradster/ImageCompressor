import React, { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Zap, Wand2, LogOut, Crown, Star } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UploadZone from '@/components/upload-zone';
import FilePreview from '@/components/file-preview';
import CompressionSettingsComponent from '@/components/compression-settings';
import BatchQueue from '@/components/batch-queue';
import BulkActions from '@/components/bulk-actions';
import AdBanner from '@/components/ads/AdBanner';
import AdSidebar from '@/components/ads/AdSidebar';
import AdInArticle from '@/components/ads/AdInArticle';
import type { ImageFile, CompressionSettings, BatchProgress } from '@shared/schema';

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 85,
    mode: 'balanced',
    webOptimized: true,
    sharpenFilter: false,
    noiseReduction: false,
  });
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  // Fetch subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription/status'],
    enabled: !!user,
  });

  const isPremium = (subscriptionStatus as any)?.tier === 'premium' && (subscriptionStatus as any)?.status === 'active';
  const dailyCompressionLimit = isPremium ? -1 : 10;

  const addFiles = useCallback((newFiles: ImageFile[]) => {
    const currentCompressed = files.filter(file => file.status === 'compressed').length;
    
    // Check usage limits for free users
    if (!isPremium && currentCompressed >= dailyCompressionLimit) {
      toast({
        title: "Usage Limit Reached",
        description: "Upgrade to Premium for unlimited compressions.",
        variant: "destructive",
      });
      return;
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  }, [files, isPremium, dailyCompressionLimit, toast]);

  const updateFile = useCallback((id: string, updates: Partial<ImageFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setBatchProgress(null);
  }, []);

  const compressedFiles = files.filter(file => file.status === 'compressed');
  const totalSavings = compressedFiles.reduce((sum: number, file: ImageFile) => sum + (file.savings || 0), 0);
  const totalSavingsPercentage = compressedFiles.length > 0 
    ? Math.round(compressedFiles.reduce((sum: number, file: ImageFile) => sum + (file.savingsPercentage || 0), 0) / compressedFiles.length)
    : 0;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-slate-900">JPEG Compressor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-slate-900 flex items-center">
                    Welcome back!
                    {isPremium && <Crown className="w-4 h-4 ml-1 text-yellow-500" />}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isPremium ? 'Premium Member - Unlimited' : `${dailyCompressionLimit - compressedFiles.length} compressions left today`}
                  </div>
                </div>
              </div>
              
              {!isPremium && (
                <Link href="/subscription">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Star className="w-4 h-4 mr-1" />
                    Upgrade
                  </Button>
                </Link>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Top Banner Ad */}
      <AdBanner slot="4444444444" className="max-w-7xl mx-auto px-4" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Upload Section */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Compress Your JPEG Images</h2>
                <p className="text-slate-600 text-lg">Reduce file size without losing quality. Upload multiple images and compress them instantly.</p>
              </div>

              <UploadZone onFilesAdded={addFiles} />

              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-2xl font-bold text-blue-600">{files.length}</div>
                  <div className="text-sm text-slate-600">Files Uploaded</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-2xl font-bold text-green-600">
                    {compressedFiles.length + (batchProgress?.completed || 0)}
                  </div>
                  <div className="text-sm text-slate-600">Compressed</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-2xl font-bold text-amber-600">
                    {batchProgress?.totalSavingsPercentage || totalSavingsPercentage}%
                  </div>
                  <div className="text-sm text-slate-600">Average Savings</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((totalSavings + (batchProgress?.totalSavings || 0)) / 1024)}KB
                  </div>
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

            {/* In-Article Ad */}
            {files.length > 0 && <AdInArticle slot="5555555555" />}

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

            {/* Batch Processing Queue */}
            <BatchQueue onProgressUpdate={setBatchProgress} />

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
          </div>

          {/* Sidebar with Ads */}
          <div className="lg:w-80">
            <div className="sticky top-8 space-y-6">
              <AdSidebar slot="6666666666" />
              
              {/* Usage Limit Card */}
              <div className={`rounded-lg p-6 shadow-sm border ${isPremium ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
                {isPremium ? (
                  <div className="text-center">
                    <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Premium Active</h3>
                    <p className="text-yellow-700 text-sm mb-4">Unlimited compressions</p>
                    <Link href="/subscription">
                      <Button variant="outline" size="sm" className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                        Manage Subscription
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Usage Today</h3>
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-slate-900">
                        {compressedFiles.length}/{dailyCompressionLimit}
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(compressedFiles.length / dailyCompressionLimit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <Link href="/subscription">
                      <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <Crown className="w-4 h-4 mr-1" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Choose Our Compressor?</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <Shield className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>100% private - files never leave your device</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Instant processing with advanced algorithms</span>
                  </li>
                  <li className="flex items-start">
                    <Wand2 className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Professional quality assessment tools</span>
                  </li>
                </ul>
              </div>

              <AdSidebar slot="7777777777" />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Banner Ad */}
      <AdBanner slot="8888888888" className="max-w-7xl mx-auto px-4 mb-8" />

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