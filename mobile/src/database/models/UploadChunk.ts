/**
 * UploadChunk Model
 *
 * Tracks chunked upload progress for resumability
 */

export type ContentType = 'story' | 'family_object' | 'attachment';

export interface UploadChunk {
  id: string;
  content_type: ContentType;
  content_id: string;
  file_path: string;
  chunk_index: number;
  total_chunks: number;
  upload_url: string | null;
  is_uploaded: boolean;
  retry_count: number;
  created_at: number; // Unix timestamp
  uploaded_at: number | null;
}

export interface CreateUploadChunkInput {
  id: string;
  content_type: ContentType;
  content_id: string;
  file_path: string;
  chunk_index: number;
  total_chunks: number;
}

export interface UpdateUploadChunkInput {
  upload_url?: string | null;
  is_uploaded?: boolean;
  retry_count?: number;
  uploaded_at?: number | null;
}
