import { open, type DB } from '@op-engineering/op-sqlite';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { EncryptionService } from '@services/encryption/EncryptionService';

/**
 * DatabaseManager
 *
 * Manages SQLite database with SQLCipher encryption
 */
class DatabaseManager {
  private static instance: DatabaseManager;
  private db: DB | null = null;
  private readonly DB_NAME = 'griot_grits.db';
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database with encryption
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[DatabaseManager] Already initialized');
      return;
    }

    try {
      console.log('[DatabaseManager] Initializing encrypted database...');

      // Get encryption key from EncryptionService
      const encryptionService = EncryptionService.getInstance();
      const dbKey = await encryptionService.getDatabaseKey();

      // Open encrypted database
      this.db = open({
        name: this.DB_NAME,
        encryptionKey: dbKey,
      });

      console.log('[DatabaseManager] Database opened with encryption');

      // Run schema
      await this.runSchema();

      // Run migrations
      await this.runMigrations();

      this.isInitialized = true;
      console.log('[DatabaseManager] Initialization complete');
    } catch (error) {
      console.error('[DatabaseManager] Initialization failed:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Get database instance
   */
  public getDatabase(): DB {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Run database schema
   */
  private async runSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not open');
    }

    console.log('[DatabaseManager] Running schema...');

    try {
      // Read schema file
      const schemaPath = `${Platform.select({
        ios: RNFS.MainBundlePath,
        android: RNFS.DocumentDirectoryPath,
      })}/schema.sql`;

      // For now, execute schema inline (schema file will be bundled separately)
      // This is a simplified version - in production, read from bundled asset
      const schema = await this.getSchemaSQL();

      // Execute schema
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        this.db.execute(statement);
      }

      console.log(`[DatabaseManager] Schema executed: ${statements.length} statements`);
    } catch (error) {
      console.error('[DatabaseManager] Schema execution failed:', error);
      throw error;
    }
  }

  /**
   * Get schema SQL (temporary inline version)
   * TODO: Bundle schema.sql as asset and read from file
   */
  private async getSchemaSQL(): Promise<string> {
    // This would ideally be loaded from the bundled schema.sql file
    // For now, returning a minimal schema to get started
    return `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        profile_photo_url TEXT,
        membership_tier TEXT NOT NULL DEFAULT 'free',
        storage_quota_bytes INTEGER NOT NULL DEFAULT 5368709120,
        storage_used_bytes INTEGER NOT NULL DEFAULT 0,
        linked_auth_providers TEXT,
        preferences TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT,
        video_local_path TEXT,
        thumbnail_url TEXT,
        duration_seconds INTEGER,
        quality TEXT,
        privacy TEXT NOT NULL DEFAULT 'public',
        original_privacy TEXT,
        is_auto_privated INTEGER NOT NULL DEFAULT 0,
        processing_status TEXT NOT NULL DEFAULT 'pending',
        ai_metadata TEXT,
        chunk_count INTEGER DEFAULT 1,
        chunk_info TEXT,
        location_id TEXT,
        like_count INTEGER NOT NULL DEFAULT 0,
        is_favorited_by_user INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        etag TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        uploaded_at INTEGER,
        cached_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_stories_user_privacy ON stories(user_id, privacy, created_at);
      CREATE INDEX IF NOT EXISTS idx_stories_sync_status ON stories(sync_status);
    `;
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    console.log('[DatabaseManager] Running migrations...');
    // TODO: Implement migration system
    // For now, no migrations needed
  }

  /**
   * Close database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('[DatabaseManager] Database closed');
    }
  }

  /**
   * Execute raw SQL (for debugging)
   */
  public execute(sql: string, params?: unknown[]): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    this.db.execute(sql, params);
  }

  /**
   * Execute query and return results
   */
  public executeQuery<T>(sql: string, params?: unknown[]): T[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const result = this.db.execute(sql, params);
    return (result.rows?._array || []) as T[];
  }
}

export default DatabaseManager;
