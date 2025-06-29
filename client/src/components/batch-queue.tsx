import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Trash2, 
  Settings, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Users
} from "lucide-react";
import { batchProcessor, BatchProgress, QueueItem } from "@/lib/batch-processor";
import { formatFileSize } from "@/lib/file-utils";

interface BatchQueueProps {
  onProgressUpdate?: (progress: BatchProgress) => void;
}

export default function BatchQueue({ onProgressUpdate }: BatchQueueProps) {
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    processing: 0,
    pending: 0,
    paused: 0,
    estimatedTimeRemaining: 0,
    averageProcessingTime: 0,
    totalSavings: 0,
    totalSavingsPercentage: 0
  });
  
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [status, setStatus] = useState({ isRunning: false, isPaused: false, queueLength: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    maxConcurrency: 3,
    retryLimit: 2,
    pauseOnError: false,
    prioritizeSmallFiles: true
  });

  useEffect(() => {
    // Set up event handlers
    batchProcessor.onProgressUpdate((newProgress) => {
      setProgress(newProgress);
      onProgressUpdate?.(newProgress);
    });

    batchProcessor.onItemCompleted((item) => {
      setQueueItems(batchProcessor.getQueueItems());
    });

    batchProcessor.onItemFailed((item, error) => {
      setQueueItems(batchProcessor.getQueueItems());
    });

    // Update initial state
    setProgress(batchProcessor.getProgress());
    setQueueItems(batchProcessor.getQueueItems());
    setStatus(batchProcessor.getStatus());

    // Set up periodic updates
    const interval = setInterval(() => {
      setStatus(batchProcessor.getStatus());
      setQueueItems(batchProcessor.getQueueItems());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [onProgressUpdate]);

  const handlePlay = () => {
    batchProcessor.resume();
  };

  const handlePause = () => {
    batchProcessor.pause();
  };

  const handleStop = () => {
    batchProcessor.stop();
  };

  const handleRetryFailed = () => {
    batchProcessor.retryFailed();
  };

  const handleClearCompleted = () => {
    batchProcessor.clearCompleted();
  };

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    batchProcessor.updateConfig(newConfig);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return '< 1s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'paused':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: QueueItem['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'outline',
      completed: 'default',
      failed: 'destructive',
      paused: 'outline'
    } as const;

    const colors = {
      pending: 'bg-slate-100 text-slate-700',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      paused: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const completionPercentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  if (progress.total === 0) {
    return null; // Don't show queue when empty
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Batch Processing Queue</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {progress.total} items
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Overall Progress</span>
            <span className="text-sm text-slate-600">{completionPercentage}% Complete</span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{progress.completed}</div>
              <div className="text-xs text-slate-600">Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{progress.processing}</div>
              <div className="text-xs text-slate-600">Processing</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-600">{progress.pending + progress.paused}</div>
              <div className="text-xs text-slate-600">Pending</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
              <div className="text-xs text-slate-600">Failed</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-purple-600">{progress.totalSavingsPercentage}%</div>
              <div className="text-xs text-slate-600">Avg Savings</div>
            </div>
          </div>
        </div>

        {/* Time Estimates */}
        {progress.estimatedTimeRemaining > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-600">Estimated Time Remaining</div>
                <div className="text-lg font-semibold text-blue-700">
                  {formatTime(progress.estimatedTimeRemaining)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Average Processing Time</div>
                <div className="text-lg font-semibold text-blue-700">
                  {formatTime(progress.averageProcessingTime)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {!status.isRunning ? (
            <Button onClick={handlePlay} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Start Queue
            </Button>
          ) : status.isPaused ? (
            <Button onClick={handlePlay} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          ) : (
            <Button onClick={handlePause} variant="outline">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          <Button onClick={handleStop} variant="destructive">
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
          
          {progress.failed > 0 && (
            <Button onClick={handleRetryFailed} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Failed ({progress.failed})
            </Button>
          )}
          
          {progress.completed > 0 && (
            <Button onClick={handleClearCompleted} variant="ghost">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Completed
            </Button>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium text-slate-700">Queue Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Max Concurrent Jobs</Label>
                  <select
                    value={config.maxConcurrency}
                    onChange={(e) => handleConfigChange('maxConcurrency', Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-md text-sm"
                  >
                    <option value={1}>1 (Sequential)</option>
                    <option value={2}>2 Jobs</option>
                    <option value={3}>3 Jobs</option>
                    <option value={4}>4 Jobs</option>
                    <option value={5}>5 Jobs</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Retry Limit</Label>
                  <select
                    value={config.retryLimit}
                    onChange={(e) => handleConfigChange('retryLimit', Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-md text-sm"
                  >
                    <option value={0}>No Retries</option>
                    <option value={1}>1 Retry</option>
                    <option value={2}>2 Retries</option>
                    <option value={3}>3 Retries</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Pause on Error</Label>
                    <p className="text-xs text-slate-500">Stop processing when any item fails</p>
                  </div>
                  <Switch
                    checked={config.pauseOnError}
                    onCheckedChange={(checked) => handleConfigChange('pauseOnError', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Prioritize Small Files</Label>
                    <p className="text-xs text-slate-500">Process smaller files first for faster completion</p>
                  </div>
                  <Switch
                    checked={config.prioritizeSmallFiles}
                    onCheckedChange={(checked) => handleConfigChange('prioritizeSmallFiles', checked)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Queue Items List (showing recent items) */}
        {queueItems.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-700">Queue Items</h4>
                <span className="text-sm text-slate-500">
                  Showing recent {Math.min(queueItems.length, 10)} of {queueItems.length}
                </span>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {queueItems.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getStatusIcon(item.status)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {item.file.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatFileSize(item.file.originalSize)}
                          {item.file.compressedSize && (
                            <> → {formatFileSize(item.file.compressedSize)}</>
                          )}
                          {item.file.savingsPercentage && (
                            <span className="text-green-600 ml-2">
                              -{item.file.savingsPercentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.status === 'processing' && (
                        <div className="text-xs text-blue-600">
                          {item.file.progress}%
                        </div>
                      )}
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}