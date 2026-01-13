import * as tus from 'tus-js-client';
import RNFS from 'react-native-fs';
import { EncryptionService } from '../encryption/EncryptionService';
import { errorHandler } from '../api/ErrorHandler';
import { connectivityMonitor } from '../sync/ConnectivityMonitor';

export interface ChunkedUploadOptions {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize?: number;
  metadata?: Record<string, string>;
  encrypt?: boolean;
  onProgress?: (uploadedBytes: number, totalBytes: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
  onError?: (error: Error) => void;
}

export interface UploadResult {
  uploadUrl: string;
  etag?: string;
  uploadedBytes: number;
  totalChunks: number;
}

/**
 * ChunkedUploadService
 *
 * Implements TUS protocol for resumable chunked uploads
 * Supports encryption and progress tracking
 */
class ChunkedUploadService {
  private static instance: ChunkedUploadService;
  private encryptionService: EncryptionService;
  private readonly DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_RETRIES = 3;
  private activeUploads: Map<string, tus.Upload> = new Map();

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }

  public static getInstance(): ChunkedUploadService {
    if (!ChunkedUploadService.instance) {
      ChunkedUploadService.instance = new ChunkedUploadService();
    }
    return ChunkedUploadService.instance;
  }

  /**
   * Upload file using TUS protocol with optional encryption
   */
  async uploadFile(options: ChunkedUploadOptions): Promise<UploadResult> {
    const {
      filePath,
      fileName,
      fileSize,
      mimeType,
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      metadata = {},
      encrypt = true,
      onProgress,
      onChunkComplete,
      onError,
    } = options;

    console.log(`[ChunkedUploadService] Starting upload: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    // Check connectivity
    if (!connectivityMonitor.canUpload()) {
      throw new Error('Cannot upload: poor connectivity or offline');
    }

    let uploadFilePath = filePath;
    let encryptionMetadata: { iv: string; authTag: string } | null = null;

    try {
      // Encrypt file if requested
      if (encrypt) {
        console.log('[ChunkedUploadService] Encrypting file before upload...');
        const encryptedPath = `${filePath}.encrypted`;
        encryptionMetadata = await this.encryptionService.encryptFile(filePath, encryptedPath);
        uploadFilePath = encryptedPath;
        console.log('[ChunkedUploadService] File encrypted');
      }

      // Get upload endpoint from environment or config
      const uploadEndpoint = this.getUploadEndpoint();

      // Prepare metadata
      const tusMetadata = {
        filename: fileName,
        filetype: mimeType,
        ...metadata,
      };

      if (encryptionMetadata) {
        tusMetadata.encrypted = 'true';
        tusMetadata.encryption_iv = encryptionMetadata.iv;
        tusMetadata.encryption_auth_tag = encryptionMetadata.authTag;
      }

      // Calculate total chunks
      const totalChunks = Math.ceil(fileSize / chunkSize);

      // Read file as blob
      const fileContent = await RNFS.readFile(uploadFilePath, 'base64');
      const fileBlob = this.base64ToBlob(fileContent, mimeType);

      // Create TUS upload
      const upload = await this.createTusUpload(
        fileBlob,
        {
          endpoint: uploadEndpoint,
          chunkSize,
          metadata: tusMetadata,
          onProgress: (bytesUploaded, bytesTotal) => {
            if (onProgress) {
              onProgress(bytesUploaded, bytesTotal);
            }

            // Calculate chunk progress
            const currentChunk = Math.floor(bytesUploaded / chunkSize);
            if (onChunkComplete && bytesUploaded % chunkSize === 0 && bytesUploaded > 0) {
              onChunkComplete(currentChunk, totalChunks);
            }
          },
          onError: (error) => {
            console.error('[ChunkedUploadService] Upload error:', error);
            if (onError) {
              onError(error);
            }
          },
        }
      );

      // Store active upload for pause/resume
      this.activeUploads.set(fileName, upload);

      // Start upload
      await this.startUpload(upload);

      // Get upload URL
      const uploadUrl = upload.url || '';

      // Clean up encrypted file if created
      if (encrypt && uploadFilePath !== filePath) {
        await RNFS.unlink(uploadFilePath);
      }

      // Remove from active uploads
      this.activeUploads.delete(fileName);

      console.log(`[ChunkedUploadService] Upload complete: ${fileName}`);

      return {
        uploadUrl,
        uploadedBytes: fileSize,
        totalChunks,
      };
    } catch (error) {
      console.error('[ChunkedUploadService] Upload failed:', error);

      // Clean up encrypted file if created
      if (encrypt && uploadFilePath !== filePath) {
        try {
          await RNFS.unlink(uploadFilePath);
        } catch (cleanupError) {
          console.error('[ChunkedUploadService] Cleanup error:', cleanupError);
        }
      }

      throw error;
    }
  }

  /**
   * Pause an active upload
   */
  pauseUpload(fileName: string): boolean {
    const upload = this.activeUploads.get(fileName);
    if (upload) {
      upload.abort();
      console.log(`[ChunkedUploadService] Paused upload: ${fileName}`);
      return true;
    }
    return false;
  }

  /**
   * Resume a paused upload
   */
  async resumeUpload(fileName: string): Promise<boolean> {
    const upload = this.activeUploads.get(fileName);
    if (upload) {
      try {
        await this.startUpload(upload);
        console.log(`[ChunkedUploadService] Resumed upload: ${fileName}`);
        return true;
      } catch (error) {
        console.error(`[ChunkedUploadService] Resume failed: ${fileName}`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Cancel an active upload
   */
  async cancelUpload(fileName: string): Promise<boolean> {
    const upload = this.activeUploads.get(fileName);
    if (upload) {
      upload.abort(true); // true = shouldTerminate
      this.activeUploads.delete(fileName);
      console.log(`[ChunkedUploadService] Cancelled upload: ${fileName}`);
      return true;
    }
    return false;
  }

  /**
   * Create TUS upload instance
   */
  private async createTusUpload(
    file: Blob,
    options: {
      endpoint: string;
      chunkSize: number;
      metadata: Record<string, string>;
      onProgress: (bytesUploaded: number, bytesTotal: number) => void;
      onError: (error: Error) => void;
    }
  ): Promise<tus.Upload> {
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: options.endpoint,
        retryDelays: [0, 1000, 3000, 5000], // Retry delays in ms
        chunkSize: options.chunkSize,
        metadata: options.metadata,
        onError: options.onError,
        onProgress: options.onProgress,
        onSuccess: () => {
          console.log('[ChunkedUploadService] TUS upload success');
        },
      });

      resolve(upload);
    });
  }

  /**
   * Start TUS upload
   */
  private async startUpload(upload: tus.Upload): Promise<void> {
    return new Promise((resolve, reject) => {
      // Override onSuccess and onError for promise resolution
      const originalOnSuccess = upload.options.onSuccess;
      const originalOnError = upload.options.onError;

      upload.options.onSuccess = () => {
        if (originalOnSuccess) {
          originalOnSuccess();
        }
        resolve();
      };

      upload.options.onError = (error) => {
        if (originalOnError) {
          originalOnError(error);
        }
        reject(error);
      };

      // Find previous upload if exists (for resume)
      upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length > 0) {
          console.log('[ChunkedUploadService] Resuming from previous upload');
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        // Start upload
        upload.start();
      });
    });
  }

  /**
   * Convert base64 to Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:.*?;base64,/, '');

    // Convert to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: mimeType });
  }

  /**
   * Get upload endpoint from environment
   */
  private getUploadEndpoint(): string {
    // TODO: Get from environment configuration
    // For now, return a placeholder
    const baseUrl = process.env.API_BASE_URL || 'https://api.griotandgrits.org';
    return `${baseUrl}/api/uploads`;
  }
}

export const chunkedUploadService = ChunkedUploadService.getInstance();
export default chunkedUploadService;
