import DatabaseManager from '@/database/DatabaseManager';

export interface ConflictResolution {
  action: 'use_local' | 'use_server' | 'merge' | 'fail';
  resolvedData?: any;
  reason: string;
}

export interface ResourceVersion {
  id: string;
  etag: string;
  data: any;
  updatedAt: number;
}

/**
 * ConflictResolver
 *
 * Handles data conflicts using ETags when syncing with backend
 * Implements last-write-wins and custom merge strategies
 */
class ConflictResolver {
  private static instance: ConflictResolver;

  private constructor() {}

  public static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  /**
   * Resolve conflict between local and server versions
   *
   * @param local - Local resource version
   * @param server - Server resource version
   * @param resourceType - Type of resource (story, familyObject, etc.)
   * @returns Resolution strategy and merged data if applicable
   */
  resolveConflict(
    local: ResourceVersion,
    server: ResourceVersion,
    resourceType: string
  ): ConflictResolution {
    console.log(`[ConflictResolver] Resolving conflict for ${resourceType} ${local.id}`);
    console.log(`[ConflictResolver] Local ETag: ${local.etag}, Server ETag: ${server.etag}`);

    // If ETags match, no conflict
    if (local.etag === server.etag) {
      return {
        action: 'use_local',
        resolvedData: local.data,
        reason: 'ETags match, no conflict',
      };
    }

    // Use timestamp-based last-write-wins strategy
    if (local.updatedAt > server.updatedAt) {
      console.log('[ConflictResolver] Local version is newer');
      return {
        action: 'use_local',
        resolvedData: local.data,
        reason: `Local version newer (${new Date(local.updatedAt).toISOString()} > ${new Date(server.updatedAt).toISOString()})`,
      };
    }

    if (server.updatedAt > local.updatedAt) {
      console.log('[ConflictResolver] Server version is newer');
      return {
        action: 'use_server',
        resolvedData: server.data,
        reason: `Server version newer (${new Date(server.updatedAt).toISOString()} > ${new Date(local.updatedAt).toISOString()})`,
      };
    }

    // Timestamps are equal, try to merge non-conflicting fields
    try {
      const merged = this.mergeResources(local.data, server.data, resourceType);
      if (merged) {
        console.log('[ConflictResolver] Successfully merged versions');
        return {
          action: 'merge',
          resolvedData: merged,
          reason: 'Merged non-conflicting changes',
        };
      }
    } catch (error) {
      console.error('[ConflictResolver] Merge failed:', error);
    }

    // Default to server version if unable to resolve
    console.warn('[ConflictResolver] Unable to resolve, defaulting to server version');
    return {
      action: 'use_server',
      resolvedData: server.data,
      reason: 'Unable to determine precedence, using server version as default',
    };
  }

  /**
   * Merge non-conflicting changes between local and server versions
   *
   * @param local - Local data
   * @param server - Server data
   * @param resourceType - Type of resource
   * @returns Merged data or null if merge not possible
   */
  private mergeResources(local: any, server: any, resourceType: string): any | null {
    // For now, implement simple field-level merging
    // More sophisticated merging can be added per resource type

    if (!local || !server || typeof local !== 'object' || typeof server !== 'object') {
      return null;
    }

    const merged = { ...server }; // Start with server version

    // Merge fields that are present in local but not in server
    for (const key in local) {
      if (!(key in server)) {
        merged[key] = local[key];
      }
    }

    // For specific resource types, apply custom merge logic
    switch (resourceType) {
      case 'story':
        return this.mergeStory(local, server, merged);
      case 'familyObject':
        return this.mergeFamilyObject(local, server, merged);
      default:
        return merged;
    }
  }

  /**
   * Merge story-specific fields
   */
  private mergeStory(local: any, server: any, merged: any): any {
    // Preserve local progress/state fields
    if (local.progress !== undefined) {
      merged.progress = local.progress;
    }

    // Preserve local cache status
    if (local.cached_at !== undefined) {
      merged.cached_at = local.cached_at;
    }

    // Preserve local sync status
    if (local.sync_status !== undefined) {
      merged.sync_status = local.sync_status;
    }

    return merged;
  }

  /**
   * Merge family object-specific fields
   */
  private mergeFamilyObject(local: any, server: any, merged: any): any {
    // Similar to story merging
    if (local.cached_at !== undefined) {
      merged.cached_at = local.cached_at;
    }

    if (local.sync_status !== undefined) {
      merged.sync_status = local.sync_status;
    }

    return merged;
  }

  /**
   * Check if local resource should be synced to server
   *
   * @param resourceId - Resource ID
   * @param resourceType - Type of resource
   * @param serverEtag - ETag from server
   * @returns True if should sync, false if server is already up to date
   */
  shouldSync(resourceId: string, resourceType: string, serverEtag: string): boolean {
    try {
      const db = DatabaseManager.getInstance().getDatabase();

      let table: string;
      switch (resourceType) {
        case 'story':
          table = 'stories';
          break;
        case 'familyObject':
          table = 'family_objects';
          break;
        default:
          return true; // Sync if unknown type
      }

      const result = db.execute(
        `SELECT etag FROM ${table} WHERE id = ?`,
        [resourceId]
      );

      const localEtag = result.rows?._array[0]?.etag;

      if (!localEtag) {
        // No local ETag, should sync
        return true;
      }

      // Only sync if ETags differ
      return localEtag !== serverEtag;
    } catch (error) {
      console.error('[ConflictResolver] Error checking sync status:', error);
      return true; // Sync on error to be safe
    }
  }

  /**
   * Update local ETag after successful sync
   *
   * @param resourceId - Resource ID
   * @param resourceType - Type of resource
   * @param newEtag - New ETag from server
   */
  updateLocalEtag(resourceId: string, resourceType: string, newEtag: string): void {
    try {
      const db = DatabaseManager.getInstance().getDatabase();

      let table: string;
      switch (resourceType) {
        case 'story':
          table = 'stories';
          break;
        case 'familyObject':
          table = 'family_objects';
          break;
        default:
          console.warn(`[ConflictResolver] Unknown resource type: ${resourceType}`);
          return;
      }

      db.execute(
        `UPDATE ${table} SET etag = ?, updated_at = ? WHERE id = ?`,
        [newEtag, Date.now(), resourceId]
      );

      console.log(`[ConflictResolver] Updated local ETag for ${resourceType} ${resourceId}`);
    } catch (error) {
      console.error('[ConflictResolver] Error updating local ETag:', error);
    }
  }

  /**
   * Generate ETag from resource data
   * Simple implementation using JSON stringification and hashing
   *
   * @param data - Resource data
   * @returns ETag string
   */
  generateEtag(data: any): string {
    const jsonString = JSON.stringify(data);
    // Simple hash function (in production, use a proper hash like SHA-256)
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export const conflictResolver = ConflictResolver.getInstance();
export default conflictResolver;
