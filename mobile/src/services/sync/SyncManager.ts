import { connectivityMonitor } from './ConnectivityMonitor';
import { useUploadQueueStore } from '@/store/uploadQueueStore';
import { errorHandler } from '../api/ErrorHandler';
import DatabaseManager from '@/database/DatabaseManager';

export interface SyncOperation {
  id: string;
  type: 'upload' | 'update' | 'delete';
  resourceType: 'story' | 'familyObject' | 'attachment';
  resourceId: string;
  data?: any;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: number;
  error?: string;
  createdAt: number;
}

/**
 * SyncManager
 *
 * Manages offline sync queue with exponential backoff retry logic
 * Processes operations when connectivity is restored
 */
class SyncManager {
  private static instance: SyncManager;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly PROCESSING_INTERVAL = 30000; // Check every 30 seconds
  private readonly BASE_DELAY = 1000; // 1 second
  private readonly MAX_DELAY = 300000; // 5 minutes

  private constructor() {
    // Subscribe to connectivity changes
    connectivityMonitor.subscribe((status) => {
      if (status.isConnected && !this.isProcessing) {
        console.log('[SyncManager] Connection restored, starting sync...');
        this.processQueue();
      }
    });
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    console.log('[SyncManager] Initializing...');

    // Start background queue processing
    this.startQueueProcessing();

    // Process any pending operations immediately if online
    if (connectivityMonitor.isConnected()) {
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
      if (connectivityMonitor.isConnected() && !this.isProcessing) {
        this.processQueue();
      }
    }, this.PROCESSING_INTERVAL);

    console.log('[SyncManager] Queue processing started');
  }

  /**
   * Stop queue processing
   */
  stopQueueProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('[SyncManager] Queue processing stopped');
    }
  }

  /**
   * Add operation to sync queue
   */
  async addToQueue(operation: Omit<SyncOperation, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    const db = DatabaseManager.getInstance().getDatabase();
    const now = Date.now();
    const id = `sync-${now}-${Math.random().toString(36).substring(2, 11)}`;

    const syncOp: SyncOperation = {
      ...operation,
      id,
      retryCount: 0,
      createdAt: now,
    };

    // Store in database
    db.execute(
      `INSERT INTO sync_queue (id, type, resource_type, resource_id, data, retry_count, max_retries, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        syncOp.id,
        syncOp.type,
        syncOp.resourceType,
        syncOp.resourceId,
        JSON.stringify(syncOp.data || {}),
        syncOp.retryCount,
        syncOp.maxRetries,
        syncOp.createdAt,
      ]
    );

    console.log(`[SyncManager] Added operation to queue: ${syncOp.type} ${syncOp.resourceType} ${syncOp.resourceId}`);

    // Try to process immediately if online
    if (connectivityMonitor.isConnected()) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Process sync queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('[SyncManager] Already processing queue');
      return;
    }

    if (!connectivityMonitor.isConnected()) {
      console.log('[SyncManager] Offline, skipping queue processing');
      return;
    }

    this.isProcessing = true;

    try {
      console.log('[SyncManager] Processing sync queue...');

      const db = DatabaseManager.getInstance().getDatabase();

      // Get pending operations ordered by creation time
      const operations = db.execute(
        `SELECT * FROM sync_queue
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT 10`
      ).rows?._array as SyncOperation[] || [];

      if (operations.length === 0) {
        console.log('[SyncManager] No pending operations');
        return;
      }

      console.log(`[SyncManager] Processing ${operations.length} operations`);

      // Process each operation
      for (const operation of operations) {
        try {
          // Check if we should retry based on exponential backoff
          if (operation.lastAttempt) {
            const delay = this.getRetryDelay(operation.retryCount);
            const timeSinceLastAttempt = Date.now() - operation.lastAttempt;

            if (timeSinceLastAttempt < delay) {
              console.log(`[SyncManager] Skipping ${operation.id}, retry delay not elapsed`);
              continue;
            }
          }

          await this.processOperation(operation);

          // Mark as completed
          db.execute(
            `UPDATE sync_queue SET status = 'completed', updated_at = ? WHERE id = ?`,
            [Date.now(), operation.id]
          );

          console.log(`[SyncManager] Completed operation: ${operation.id}`);
        } catch (error) {
          console.error(`[SyncManager] Operation failed: ${operation.id}`, error);

          // Increment retry count
          const newRetryCount = operation.retryCount + 1;

          if (newRetryCount >= operation.maxRetries) {
            // Max retries reached, mark as failed
            db.execute(
              `UPDATE sync_queue SET status = 'failed', error = ?, updated_at = ? WHERE id = ?`,
              [String(error), Date.now(), operation.id]
            );
            console.error(`[SyncManager] Operation failed after max retries: ${operation.id}`);
          } else {
            // Update retry count and last attempt
            db.execute(
              `UPDATE sync_queue SET retry_count = ?, last_attempt = ?, error = ?, updated_at = ? WHERE id = ?`,
              [newRetryCount, Date.now(), String(error), Date.now(), operation.id]
            );
            console.log(`[SyncManager] Will retry operation: ${operation.id} (attempt ${newRetryCount}/${operation.maxRetries})`);
          }
        }
      }
    } catch (error) {
      console.error('[SyncManager] Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single sync operation
   */
  private async processOperation(operation: SyncOperation): Promise<void> {
    console.log(`[SyncManager] Processing: ${operation.type} ${operation.resourceType} ${operation.resourceId}`);

    // Implementation would call appropriate API endpoints based on operation type
    // For now, this is a placeholder that will be implemented as we add API services

    switch (operation.resourceType) {
      case 'story':
        await this.processStoryOperation(operation);
        break;
      case 'familyObject':
        await this.processFamilyObjectOperation(operation);
        break;
      case 'attachment':
        await this.processAttachmentOperation(operation);
        break;
      default:
        throw new Error(`Unknown resource type: ${operation.resourceType}`);
    }
  }

  /**
   * Process story sync operation
   */
  private async processStoryOperation(operation: SyncOperation): Promise<void> {
    // TODO: Implement story API calls
    // This will be implemented when StoryApi is created in Phase 3
    console.log(`[SyncManager] Story operation not yet implemented: ${operation.type}`);
  }

  /**
   * Process family object sync operation
   */
  private async processFamilyObjectOperation(operation: SyncOperation): Promise<void> {
    // TODO: Implement family object API calls
    console.log(`[SyncManager] Family object operation not yet implemented: ${operation.type}`);
  }

  /**
   * Process attachment sync operation
   */
  private async processAttachmentOperation(operation: SyncOperation): Promise<void> {
    // TODO: Implement attachment API calls
    console.log(`[SyncManager] Attachment operation not yet implemented: ${operation.type}`);
  }

  /**
   * Calculate retry delay using exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    const delay = errorHandler.getRetryDelay(retryCount, this.BASE_DELAY, this.MAX_DELAY);
    return delay;
  }

  /**
   * Get pending operations count
   */
  async getPendingCount(): Promise<number> {
    const db = DatabaseManager.getInstance().getDatabase();
    const result = db.execute(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`
    );
    return result.rows?._array[0]?.count || 0;
  }

  /**
   * Clear completed operations older than specified days
   */
  async clearOldOperations(daysOld: number = 7): Promise<void> {
    const db = DatabaseManager.getInstance().getDatabase();
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    db.execute(
      `DELETE FROM sync_queue WHERE status = 'completed' AND created_at < ?`,
      [cutoffTime]
    );

    console.log(`[SyncManager] Cleared operations older than ${daysOld} days`);
  }

  /**
   * Retry a failed operation
   */
  async retryOperation(operationId: string): Promise<void> {
    const db = DatabaseManager.getInstance().getDatabase();

    db.execute(
      `UPDATE sync_queue SET status = 'pending', retry_count = 0, error = NULL, updated_at = ? WHERE id = ?`,
      [Date.now(), operationId]
    );

    console.log(`[SyncManager] Retry operation: ${operationId}`);

    // Try to process immediately if online
    if (connectivityMonitor.isConnected()) {
      this.processQueue();
    }
  }
}

export const syncManager = SyncManager.getInstance();
export default syncManager;
