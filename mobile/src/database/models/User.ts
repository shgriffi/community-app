/**
 * User Model
 *
 * Represents an individual using the app
 */

export interface UserPreferences {
  wifi_only_uploads?: boolean;
  location_notifications?: boolean;
  auto_backup?: boolean;
  video_quality_preference?: '240p' | '480p' | '720p' | '1080p';
}

export interface User {
  id: string;
  email: string;
  name: string;
  profile_photo_url: string | null;
  membership_tier: 'free' | 'paid';
  storage_quota_bytes: number;
  storage_used_bytes: number;
  linked_auth_providers: string[]; // ['email', 'google', 'apple', 'facebook']
  preferences: UserPreferences;
  created_at: number; // Unix timestamp
  updated_at: number; // Unix timestamp
}

export interface CreateUserInput {
  id: string;
  email: string;
  name: string;
  profile_photo_url?: string | null;
  membership_tier?: 'free' | 'paid';
  storage_quota_bytes?: number;
  storage_used_bytes?: number;
  linked_auth_providers?: string[];
  preferences?: UserPreferences;
}

export interface UpdateUserInput {
  name?: string;
  profile_photo_url?: string | null;
  preferences?: UserPreferences;
}
