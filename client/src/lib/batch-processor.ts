import { ImageFile, CompressionSettings } from "@shared/schema";
import { compressImage } from "./image-compression";

export interface QueueItem {
  id: string;
  file: ImageFile;
  settings: CompressionSettings;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  startTime?: number;
  endTime?: number;
  error?: string;
  retryCount: number;
}

export interface BatchProcessorConfig {
  maxConcurrency: number;
  retryLimit: number;
  pauseOnError: boolean;
  prioritizeSmallFiles: boolean;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
  paused: number;
  estimatedTimeRemaining: number;
  averageProcessingTime: number;
  totalSavings: number;
  totalSavingsPercentage: number;
}

export class BatchProcessor {
  private queue: QueueItem[] = [];
  private processing: Set<string> = new Set();
  private config: BatchProcessorConfig;
  private onProgress?: (progress: BatchProgress) => void;
  private onItemComplete?: (item: QueueItem) => void;
  private onItemError?: (item: QueueItem, error: string) => void;
  private isPaused: boolean = false;
  private isRunning: boolean = false;
  private processingTimes: number[] = [];

  constructor(config: Partial<BatchProcessorConfig> = {}) {
    this.config = {
      maxConcurrency: 3,
      retryLimit: 2,
      pauseOnError: false,
      prioritizeSmallFiles: true,
      ...config
    };
  }

  // Add files to the processing queue
  addToQueue(
    files: ImageFile[], 
    settings: CompressionSettings, 
    priority: QueueItem['priority'] = 'normal'
  ): void {
    const newItems: QueueItem[] = files.map(file => ({
      id: `${file.id}-${Date.now()}`,
      file,
      settings,
      priority,
      status: 'pending',
      retryCount: 0
    }));

    // Sort by priority and file size if enabled
    if (this.config.prioritizeSmallFiles) {
      newItems.sort((a, b) => {
        // First by priority
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by file size (smaller first for faster completion)
        return a.file.originalSize - b.file.originalSize;
      });
    }

    this.queue.push(...newItems);
    this.updateProgress();
    
    if (!this.isRunning && !this.isPaused) {
      this.startProcessing();
    }
  }

  // Start the batch processing
  async startProcessing(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;

    while (this.queue.length > 0 && this.isRunning && !this.isPaused) {
      // Find pending items that can be processed
      const pendingItems = this.queue.filter(
        item => item.status === 'pending' && !this.processing.has(item.id)
      );

      if (pendingItems.length === 0) {
        // No pending items, wait for current processing to complete
        await this.waitForSlot();
        continue;
      }

      // Process items up to concurrency limit
      const availableSlots = this.config.maxConcurrency - this.processing.size;
      const itemsToProcess = pendingItems.slice(0, availableSlots);

      for (const item of itemsToProcess) {
        this.processItem(item);
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isRunning = false;
  }

  // Process a single item
  private async processItem(item: QueueItem): Promise<void> {
    this.processing.add(item.id);
    item.status = 'processing';
    item.startTime = Date.now();
    this.updateProgress();

    try {
      const result = await compressImage(
        item.file.file,
        item.settings,
        (progress) => {
          // Update individual file progress
          item.file.progress = progress;
          this.onProgress?.(this.getProgress());
        }
      );

      // Update the file with compression results
      item.file.compressedSize = result.size;
      item.file.compressedBlob = result.blob;
      item.file.savings = item.file.originalSize - result.size;
      item.file.savingsPercentage = Math.round((item.file.savings / item.file.originalSize) * 100);
      item.file.status = 'compressed';
      item.file.progress = 100;

      item.status = 'completed';
      item.endTime = Date.now();
      
      // Track processing times for estimation
      if (item.startTime && item.endTime) {
        const processingTime = item.endTime - item.startTime;
        this.processingTimes.push(processingTime);
        // Keep only recent processing times for better estimation
        if (this.processingTimes.length > 20) {
          this.processingTimes.shift();
        }
      }

      this.onItemComplete?.(item);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      item.error = errorMessage;
      item.file.status = 'error';
      
      // Retry logic
      if (item.retryCount < this.config.retryLimit) {
        item.retryCount++;
        item.status = 'pending';
        item.file.status = 'ready';
      } else {
        item.status = 'failed';
        this.onItemError?.(item, errorMessage);
        
        // Pause on error if configured
        if (this.config.pauseOnError) {
          this.pause();
        }
      }
    } finally {
      this.processing.delete(item.id);
      this.updateProgress();
    }
  }

  // Wait for a processing slot to become available
  private async waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      const checkSlot = () => {
        if (this.processing.size < this.config.maxConcurrency || !this.isRunning) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  // Pause processing
  pause(): void {
    this.isPaused = true;
    this.updateProgress();
  }

  // Resume processing
  resume(): void {
    this.isPaused = false;
    if (!this.isRunning) {
      this.startProcessing();
    }
    this.updateProgress();
  }

  // Stop processing and clear queue
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.processing.clear();
    this.queue = [];
    this.processingTimes = [];
    this.updateProgress();
  }

  // Clear completed items from queue
  clearCompleted(): void {
    this.queue = this.queue.filter(item => 
      item.status !== 'completed' && item.status !== 'failed'
    );
    this.updateProgress();
  }

  // Retry failed items
  retryFailed(): void {
    this.queue.forEach(item => {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.retryCount = 0;
        item.error = undefined;
        item.file.status = 'ready';
      }
    });
    
    if (!this.isRunning && !this.isPaused) {
      this.startProcessing();
    }
    this.updateProgress();
  }

  // Get current progress
  getProgress(): BatchProgress {
    const total = this.queue.length;
    const completed = this.queue.filter(item => item.status === 'completed').length;
    const failed = this.queue.filter(item => item.status === 'failed').length;
    const processing = this.queue.filter(item => item.status === 'processing').length;
    const pending = this.queue.filter(item => item.status === 'pending').length;
    const paused = this.isPaused ? pending + processing : 0;

    // Calculate average processing time
    const averageProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
      : 0;

    // Estimate remaining time
    const remainingItems = pending + processing;
    const estimatedTimeRemaining = remainingItems > 0 && averageProcessingTime > 0
      ? (remainingItems * averageProcessingTime) / this.config.maxConcurrency
      : 0;

    // Calculate total savings
    const completedItems = this.queue.filter(item => item.status === 'completed');
    const totalSavings = completedItems.reduce((sum, item) => 
      sum + (item.file.savings || 0), 0
    );
    const totalOriginalSize = completedItems.reduce((sum, item) => 
      sum + item.file.originalSize, 0
    );
    const totalSavingsPercentage = totalOriginalSize > 0 
      ? Math.round((totalSavings / totalOriginalSize) * 100) 
      : 0;

    return {
      total,
      completed,
      failed,
      processing,
      pending: this.isPaused ? 0 : pending,
      paused,
      estimatedTimeRemaining,
      averageProcessingTime,
      totalSavings,
      totalSavingsPercentage
    };
  }

  // Get queue items
  getQueueItems(): QueueItem[] {
    return [...this.queue];
  }

  // Update configuration
  updateConfig(newConfig: Partial<BatchProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Set event handlers
  onProgressUpdate(callback: (progress: BatchProgress) => void): void {
    this.onProgress = callback;
  }

  onItemCompleted(callback: (item: QueueItem) => void): void {
    this.onItemComplete = callback;
  }

  onItemFailed(callback: (item: QueueItem, error: string) => void): void {
    this.onItemError = callback;
  }

  // Private method to update progress
  private updateProgress(): void {
    this.onProgress?.(this.getProgress());
  }

  // Get current status
  getStatus(): { isRunning: boolean; isPaused: boolean; queueLength: number } {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      queueLength: this.queue.length
    };
  }
}

// Export singleton instance
export const batchProcessor = new BatchProcessor();