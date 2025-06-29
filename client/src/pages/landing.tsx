import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdBanner from "@/components/ads/AdBanner";
import AdInArticle from "@/components/ads/AdInArticle";
import { Zap, Shield, Download, Gauge, Eye, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">JPEG Compressor</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => window.location.href = '/login'}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => window.location.href = '/register'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Top Banner Ad */}
      <AdBanner slot="1234567890" className="container mx-auto px-4" />

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            Professional Image Compression
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Compress JPEG Images
            <br />
            <span className="text-blue-600">Without Quality Loss</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Advanced compression technology with real-time quality assessment. 
            Reduce file sizes while maintaining professional image quality.
          </p>
          <Button 
            onClick={() => window.location.href = '/register'}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Get Started Free
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Advanced Compression</h3>
              <p className="text-gray-600">
                Three intelligent compression modes: Aggressive, Balanced, and Gentle. 
                Each optimized for different use cases.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Quality Assessment</h3>
              <p className="text-gray-600">
                Professional quality analysis with PSNR and SSIM metrics. 
                Visual comparison tools for detailed inspection.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Batch Processing</h3>
              <p className="text-gray-600">
                Process multiple images simultaneously with intelligent queue management 
                and real-time progress tracking.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* In-Article Ad */}
        <AdInArticle slot="2222222222" />

        {/* Key Benefits */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Why Choose Our Compressor?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Client-side processing for complete privacy</span>
              </div>
              <div className="flex items-center space-x-3">
                <Gauge className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Real-time compression progress tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Individual or bulk ZIP downloads</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Advanced quality metrics and analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Multiple compression algorithms</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">Intelligent batch queue management</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Ready to Start Compressing?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who trust our professional compression technology.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Sign In to Get Started
          </Button>
        </div>

        {/* Bottom Banner Ad */}
        <AdBanner slot="3333333333" className="mt-16" />
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200 mt-16">
        <div className="text-center text-gray-500">
          <p>&copy; 2025 JPEG Compressor. Professional image compression made simple.</p>
        </div>
      </footer>
    </div>
  );
}