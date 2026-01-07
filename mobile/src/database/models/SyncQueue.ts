/**
 * SyncQueue Model
 *
 * Offline operation queue for sync when online
 */

export type EntityType = 'story' | 'family_object' | 'attachment' | 'family_tree_member' | 'like' | 'favorite';
export type Operation = 'create' | 'update' | 'delete';

export interface SyncQueue {
  id: number; // AUTO INCREMENT
  entity_type: EntityType;
  entity_id: string;
  operation: Operation;
  payload: Record<string, unknown>; // JSON object
  retry_count: number;
  last_error: string | null;
  created_at: number; // Unix timestamp
  last_retry_at: number | null;
}

export interface CreateSyncQueueInput {
  entity_type: EntityType;
  entity_id: string;
  operation: Operation;
  payload: Record<string, unknown>;
}
