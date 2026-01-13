import { Upload, startUpload, getUploadStatus, UploadOptions } from 'react-native-background-upload';
import { useUploadQueueStore } from '@/store/uploadQueueStore';
import { EncryptionService } from '../encryption/EncryptionService';
import RN FS from 'react-native-fs';

export interface BackgroundUploadOptions {
  uploadId: string;
  filePath: string;
  uploadUrl: string;
  fieldName?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, string>;
  onProgress?: (uploadId: string, progress: number) => void;
  onComplete?: (uploadId: string, response: string) => void;
  onError?: (uploadId: string, error: string) => void;
}

/**
 * BackgroundUploadService
 *
 * Manages background uploads using react-native-background-upload
 * Continues uploads even when app is backgrounded or suspended
 */
class BackgroundUploadService {
  private static instance: BackgroundUploadService;
  private encryptionService: EncryptionService;
  private activeUploads: Map<string, string> = new Map(); // uploadId -> native upload ID

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }

  public static getInstance(): BackgroundUploadService {
    if (!BackgroundUploadService.instance) {
      BackgroundUploadService.instance = new BackgroundUploadService();
    }
    return BackgroundUploadService.instance;
  }

  /**
   * Start background upload
   */
  async startBackgroundUpload(options: BackgroundUploadOptions): Promise<string> {
    const {
      uploadId,
      filePath,
      uploadUrl,
      fieldName = 'file',
      headers = {},
      parameters = {},
      onProgress,
      onComplete,
      onError,
    } = options;

    console.log(`[BackgroundUploadService] Starting background upload: ${uploadId}`);

    try {
      // Check if file exists
      const fileExists = await RNFS.exists(filePath);
      if (!fileExists) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Configure upload options
      const uploadOptions: UploadOptions = {
        url: uploadUrl,
        path: filePath,
        method: 'POST',
        type: 'multipart',
        field: fieldName,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...headers,
        },
        parameters,
        notification: {
          enabled: true,
          autoClear: true,
          notificationChannel: 'Upload',
          onProgressTitle: 'Uploading',
          onProgressMessage: 'Upload in progress...',
          onCompleteTitle: 'Upload complete',
          onCompleteMessage: 'File uploaded successfully',
          onErrorTitle: 'Upload failed',
          onErrorMessage: 'Upload failed. Will retry automatically.',
        },
      };

      // Start upload
      const nativeUploadId = await startUpload(uploadOptions);
      this.activeUploads.set(uploadId, nativeUploadId);

      console.log(`[BackgroundUploadService] Upload started with native ID: ${nativeUploadId}`);

      // Set up progress listener
      Upload.addListener('progress', nativeUploadId, (data) => {
        const progress = (data.totalBytesSent / data.totalBytesExpectedToSend) * 100;
        console.log(`[BackgroundUploadService] Progress: ${progress.toFixed(1)}%`);

        if (onProgress) {
          onProgress(uploadId, progress);
        }

        // Update queue store
        const uploadQueueStore = useUploadQueueStore.getState();
        uploadQueueStore.updateProgress(uploadId, data.totalBytesSent, 0); // Chunk tracking handled separately
        uploadQueueStore.updateStatus(uploadId, 'uploading');
      });

      // Set up completion listener
      Upload.addListener('completed', nativeUploadId, (data) => {
        console.log(`[BackgroundUploadService] Upload completed: ${uploadId}`);

        if (onComplete) {
          onComplete(uploadId, data.responseBody);
        }

        // Update queue store
        const uploadQueueStore = useUploadQueueStore.getState();
        uploadQueueStore.updateStatus(uploadId, 'completed');

        // Clean up
        this.activeUploads.delete(uploadId);
      });

      // Set up error listener
      Upload.addListener('error', nativeUploadId, (data) => {
        console.error(`[BackgroundUploadService] Upload error: ${uploadId}`, data.error);

        if (onError) {
          onError(uploadId, data.error);
        }

        // Update queue store
        const uploadQueueStore = useUploadQueueStore.getState();
        uploadQueueStore.updateStatus(uploadId, 'failed', data.error);

        // Clean up
        this.activeUploads.delete(uploadId);
      });

      // Set up cancellation listener
      Upload.addListener('cancelled', nativeUploadId, () => {
        console.log(`[BackgroundUploadService] Upload cancelled: ${uploadId}`);

        // Update queue store
        const uploadQueueStore = useUploadQueueStore.getState();
        uploadQueueStore.updateStatus(uploadId, 'paused');

        // Clean up
        this.activeUploads.delete(uploadId);
      });

      return nativeUploadId;
    } catch (error) {
      console.error('[BackgroundUploadService] Failed to start upload:', error);
      throw error;
    }
  }

  /**
   * Pause/cancel an active upload
   */
  async pauseUpload(uploadId: string): Promise<boolean> {
    const nativeUploadId = this.activeUploads.get(uploadId);
    if (!nativeUploadId) {
      console.warn(`[BackgroundUploadService] Upload not found: ${uploadId}`);
      return false;
    }

    try {
      // Cancel the upload (can be resumed later)
      Upload.cancelUpload(nativeUploadId);

      // Update queue store
      const uploadQueueStore = useUploadQueueStore.getState();
      uploadQueueStore.updateStatus(uploadId, 'paused');

      console.log(`[BackgroundUploadService] Upload paused: ${uploadId}`);
      return true;
    } catch (error) {
      console.error('[BackgroundUploadService] Failed to pause upload:', error);
      return false;
    }
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string): Promise<any> {
    const nativeUploadId = this.activeUploads.get(uploadId);
    if (!nativeUploadId) {
      return null;
    }

    try {
      const status = await getUploadStatus(nativeUploadId);
      return status;
    } catch (error) {
      console.error('[BackgroundUploadService] Failed to get upload status:', error);
      return null;
    }
  }

  /**
   * Get all active uploads
   */
  getActiveUploads(): string[] {
    return Array.from(this.activeUploads.keys());
  }

  /**
   * Check if upload is active
   */
  isUploadActive(uploadId: string): boolean {
    return this.activeUploads.has(uploadId);
  }
}

export const backgroundUploadService = BackgroundUploadService.getInstance();
export default backgroundUploadService;
