/**
 * FamilyObject Model
 *
 * Represents an uploaded family artifact (photo, document, or video) with audio narration
 */

export interface FamilyObject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  object_url: string | null;
  object_local_path: string | null;
  object_type: 'photo' | 'document' | 'video';
  file_format: string; // jpg, pdf, mp4, etc.
  thumbnail_url: string | null;
  audio_narration_url: string | null;
  audio_narration_local_path: string | null;
  privacy: 'public' | 'family_only' | 'private';
  original_privacy: 'public' | 'family_only' | 'private' | null;
  is_auto_privated: boolean;
  ai_metadata: Record<string, unknown> | null;
  location_id: string | null;
  like_count: number;
  is_favorited_by_user: boolean;
  sync_status: 'synced' | 'pending' | 'uploading' | 'failed' | 'conflict';
  etag: string | null;
  created_at: number; // Unix timestamp
  updated_at: number;
  uploaded_at: number | null;
}

export interface CreateFamilyObjectInput {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  object_local_path: string;
  object_type: 'photo' | 'document' | 'video';
  file_format: string;
  privacy?: 'public' | 'family_only' | 'private';
  location_id?: string | null;
}

export interface UpdateFamilyObjectInput {
  title?: string;
  description?: string | null;
  privacy?: 'public' | 'family_only' | 'private';
  object_url?: string | null;
  thumbnail_url?: string | null;
  audio_narration_url?: string | null;
  ai_metadata?: Record<string, unknown> | null;
  sync_status?: 'synced' | 'pending' | 'uploading' | 'failed' | 'conflict';
  etag?: string | null;
  uploaded_at?: number | null;
}
