/**
 * Location Model
 *
 * Represents geographic information associated with stories and family objects
 */

export interface Location {
  id: string;
  latitude: number;
  longitude: number;
  place_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  source: 'gps' | 'manual' | 'ai_extracted';
  created_at: number; // Unix timestamp
}

export interface CreateLocationInput {
  id: string;
  latitude: number;
  longitude: number;
  place_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  source: 'gps' | 'manual' | 'ai_extracted';
}
