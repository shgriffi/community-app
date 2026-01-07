/**
 * Story Model
 *
 * Represents a recorded family history video with metadata
 */

export interface AIMetadata {
  tags?: string[];
  topics?: string[];
  people?: string[];
  places?: string[];
  keywords?: string[];
  summary?: string;
}

export interface ChunkInfo {
  chunk_size: number;
  total_size: number;
  chunks: Array<{
    index: number;
    offset: number;
    size: number;
    uploaded: boolean;
  }>;
}

export interface Story {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  video_local_path: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  quality: '240p' | '480p' | '720p' | '1080p';
  privacy: 'public' | 'family_only' | 'private';
  original_privacy: 'public' | 'family_only' | 'private' | null;
  is_auto_privated: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_metadata: AIMetadata | null;
  chunk_count: number;
  chunk_info: ChunkInfo | null;
  location_id: string | null;
  like_count: number;
  is_favorited_by_user: boolean;
  sync_status: 'synced' | 'pending' | 'uploading' | 'failed' | 'conflict';
  etag: string | null;
  created_at: number; // Unix timestamp
  updated_at: number;
  uploaded_at: number | null;
  cached_at: number | null;
}

export interface CreateStoryInput {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  video_local_path: string;
  duration_seconds: number;
  quality: '240p' | '480p' | '720p' | '1080p';
  privacy?: 'public' | 'family_only' | 'private';
  location_id?: string | null;
}

export interface UpdateStoryInput {
  title?: string;
  description?: string | null;
  privacy?: 'public' | 'family_only' | 'private';
  video_url?: string | null;
  thumbnail_url?: string | null;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  ai_metadata?: AIMetadata | null;
  sync_status?: 'synced' | 'pending' | 'uploading' | 'failed' | 'conflict';
  etag?: string | null;
  uploaded_at?: number | null;
}
