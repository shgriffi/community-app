import { useUploadQueueStore, UploadItem } from '@/store/uploadQueueStore';
import { connectivityMonitor } from '../sync/ConnectivityMonitor';
import { backgroundUploadService } from './BackgroundUploadService';
import { chunkedUploadService } from './ChunkedUploadService';

/**
 * UploadQueueManager
 *
 * Coordinates upload queue processing with connectivity monitoring
 * Automatically processes pending uploads when conditions are suitable
 */
class UploadQueueManager {
  private static instance: UploadQueueManager;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly PROCESSING_INTERVAL = 30000; // Check every 30 seconds

  private constructor() {
    // Subscribe to connectivity changes
    connectivityMonitor.subscribe((status) => {
      if (status.isConnected && connectivityMonitor.canUpload() && !this.isProcessing) {
        console.log('[UploadQueueManager] Connection suitable for uploads, processing queue...');
        this.processQueue();
      }
    });
  }

  public static getInstance(): UploadQueueManager {
    if (!UploadQueueManager.instance) {
      UploadQueueManager.instance = new UploadQueueManager();
    }
    return UploadQueueManager.instance;
  }

  /**
   * Initialize upload queue manager
   */
  async initialize(): Promise<void> {
    console.log('[UploadQueueManager] Initializing...');

    // Start periodic queue processing
    this.startQueueProcessing();

    // Process any pending uploads if conditions are suitable
    if (connectivityMonitor.canUpload()) {
      await this.processQueue();
    }
  }

  /**
   * Start periodic queue processing
   */
  private startQueueProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      if (connectivityMonitor.canUpload() && !this.isProcessing) {
        this.processQueue();
      }
    }, this.PROCESSING_INTERVAL);

    console.log('[UploadQueueManager] Periodic processing started');
  }

  /**
   * Stop queue processing
   */
  stopQueueProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('[UploadQueueManager] Periodic processing stopped');
    }
  }

  /**
   * Process upload queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('[UploadQueueManager] Already processing queue');
      return;
    }

    if (!connectivityMonitor.canUpload()) {
      console.log('[UploadQueueManager] Network conditions not suitable for uploads');
      return;
    }

    this.isProcessing = true;

    try {
      const uploadQueueStore = useUploadQueueStore.getState();
      const pendingUploads = uploadQueueStore.getPendingUploads();

      if (pendingUploads.length === 0) {
        console.log('[UploadQueueManager] No pending uploads');
        return;
      }

      console.log(`[UploadQueueManager] Processing ${pendingUploads.length} pending uploads`);

      // Process uploads one at a time to avoid overwhelming the device
      for (const upload of pendingUploads) {
        try {
          // Check connectivity before each upload
          if (!connectivityMonitor.canUpload()) {
            console.log('[UploadQueueManager] Network conditions changed, pausing queue processing');
            break;
          }

          // Skip if already at max retries
          if (upload.retryCount >= upload.maxRetries) {
            console.log(`[UploadQueueManager] Max retries reached for ${upload.id}`);
            uploadQueueStore.updateStatus(upload.id, 'failed', 'Max retries exceeded');
            continue;
          }

          await this.processUpload(upload);
        } catch (error) {
          console.error(`[UploadQueueManager] Upload failed: ${upload.id}`, error);

          // Update retry count
          const newRetryCount = upload.retryCount + 1;

          if (newRetryCount >= upload.maxRetries) {
            uploadQueueStore.updateStatus(upload.id, 'failed', String(error));
          } else {
            // Will retry on next queue processing
            console.log(`[UploadQueueManager] Will retry ${upload.id} (${newRetryCount}/${upload.maxRetries})`);
          }
        }
      }
    } catch (error) {
      console.error('[UploadQueueManager] Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single upload
   */
  private async processUpload(upload: UploadItem): Promise<void> {
    console.log(`[UploadQueueManager] Processing upload: ${upload.fileName}`);

    const uploadQueueStore = useUploadQueueStore.getState();

    // Mark as uploading
    uploadQueueStore.updateStatus(upload.id, 'uploading');

    try {
      // Check if file exists
      const RNFS = require('react-native-fs');
      const fileExists = await RNFS.exists(upload.filePath);

      if (!fileExists) {
        throw new Error(`File not found: ${upload.filePath}`);
      }

      // Determine upload strategy based on file size
      const USE_BACKGROUND_UPLOAD = upload.fileSize > 10 * 1024 * 1024; // 10MB threshold

      if (USE_BACKGROUND_UPLOAD) {
        // Use background upload service for large files
        await this.uploadWithBackgroundService(upload);
      } else {
        // Use chunked upload service for smaller files
        await this.uploadWithChunkedService(upload);
      }

      console.log(`[UploadQueueManager] Upload complete: ${upload.id}`);
    } catch (error) {
      console.error(`[UploadQueueManager] Upload failed: ${upload.id}`, error);
      throw error;
    }
  }

  /**
   * Upload using background upload service
   */
  private async uploadWithBackgroundService(upload: UploadItem): Promise<void> {
    const uploadQueueStore = useUploadQueueStore.getState();

    // Get or create upload URL
    let uploadUrl = upload.uploadUrl;
    if (!uploadUrl) {
      // TODO: Call API to get upload URL
      // For now, use placeholder
      uploadUrl = this.getUploadEndpoint(upload);
      uploadQueueStore.setUploadUrl(upload.id, uploadUrl);
    }

    await backgroundUploadService.startBackgroundUpload({
      uploadId: upload.id,
      filePath: upload.filePath,
      uploadUrl,
      onProgress: (uploadId, progress) => {
        const uploadedBytes = Math.floor((progress / 100) * upload.fileSize);
        const uploadedChunks = Math.floor(uploadedBytes / upload.chunkSize);
        uploadQueueStore.updateProgress(uploadId, uploadedBytes, uploadedChunks);
      },
      onComplete: (uploadId) => {
        uploadQueueStore.updateStatus(uploadId, 'completed');
      },
      onError: (uploadId, error) => {
        uploadQueueStore.updateStatus(uploadId, 'failed', error);
      },
    });
  }

  /**
   * Upload using chunked upload service
   */
  private async uploadWithChunkedService(upload: UploadItem): Promise<void> {
    const uploadQueueStore = useUploadQueueStore.getState();

    const result = await chunkedUploadService.uploadFile({
      filePath: upload.filePath,
      fileName: upload.fileName,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
      chunkSize: upload.chunkSize,
      encrypt: true,
      onProgress: (uploadedBytes, totalBytes) => {
        const uploadedChunks = Math.floor(uploadedBytes / upload.chunkSize);
        uploadQueueStore.updateProgress(upload.id, uploadedBytes, uploadedChunks);
      },
      onChunkComplete: (chunkIndex, totalChunks) => {
        console.log(`[UploadQueueManager] Chunk ${chunkIndex}/${totalChunks} complete`);
      },
      onError: (error) => {
        console.error('[UploadQueueManager] Chunked upload error:', error);
      },
    });

    // Update with upload URL
    uploadQueueStore.setUploadUrl(upload.id, result.uploadUrl);
    uploadQueueStore.updateStatus(upload.id, 'completed');
  }

  /**
   * Get upload endpoint for a file
   */
  private getUploadEndpoint(upload: UploadItem): string {
    // TODO: Get from environment configuration
    const baseUrl = process.env.API_BASE_URL || 'https://api.griotandgrits.org';
    return `${baseUrl}/api/uploads`;
  }

  /**
   * Pause all active uploads
   */
  pauseAllUploads(): void {
    const uploadQueueStore = useUploadQueueStore.getState();
    const activeUploads = uploadQueueStore.queue.filter(u => u.status === 'uploading');

    for (const upload of activeUploads) {
      backgroundUploadService.pauseUpload(upload.id);
    }

    console.log(`[UploadQueueManager] Paused ${activeUploads.length} uploads`);
  }

  /**
   * Resume processing queue
   */
  resumeProcessing(): void {
    if (connectivityMonitor.canUpload()) {
      this.processQueue();
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
  } {
    const uploadQueueStore = useUploadQueueStore.getState();
    const queue = uploadQueueStore.queue;

    return {
      total: queue.length,
      pending: queue.filter(u => u.status === 'pending').length,
      uploading: queue.filter(u => u.status === 'uploading').length,
      completed: queue.filter(u => u.status === 'completed').length,
      failed: queue.filter(u => u.status === 'failed').length,
    };
  }
}

export const uploadQueueManager = UploadQueueManager.getInstance();
export default uploadQueueManager;
