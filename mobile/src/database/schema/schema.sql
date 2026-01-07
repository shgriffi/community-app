-- Griot and Grits Mobile App - SQLite Schema
-- Date: 2026-01-06
-- SQLCipher encryption enabled

-- Core User Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  profile_photo_url TEXT,
  membership_tier TEXT NOT NULL DEFAULT 'free' CHECK(membership_tier IN ('free', 'paid')),
  storage_quota_bytes INTEGER NOT NULL DEFAULT 5368709120, -- 5GB for free
  storage_used_bytes INTEGER NOT NULL DEFAULT 0,
  linked_auth_providers TEXT, -- JSON array
  preferences TEXT, -- JSON object
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Stories Table
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  video_local_path TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  quality TEXT CHECK(quality IN ('240p', '480p', '720p', '1080p')),
  privacy TEXT NOT NULL DEFAULT 'public' CHECK(privacy IN ('public', 'family_only', 'private')),
  original_privacy TEXT,
  is_auto_privated INTEGER NOT NULL DEFAULT 0,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK(processing_status IN ('pending', 'processing', 'completed', 'failed')),
  ai_metadata TEXT, -- JSON object
  chunk_count INTEGER DEFAULT 1,
  chunk_info TEXT, -- JSON object
  location_id TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  is_favorited_by_user INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('synced', 'pending', 'uploading', 'failed', 'conflict')),
  etag TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  uploaded_at INTEGER,
  cached_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_stories_user_privacy ON stories(user_id, privacy, created_at);
CREATE INDEX IF NOT EXISTS idx_stories_sync_status ON stories(sync_status);
CREATE INDEX IF NOT EXISTS idx_stories_processing_status ON stories(processing_status);

-- Family Objects Table
CREATE TABLE IF NOT EXISTS family_objects (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  object_url TEXT,
  object_local_path TEXT,
  object_type TEXT NOT NULL CHECK(object_type IN ('photo', 'document', 'video')),
  file_format TEXT,
  thumbnail_url TEXT,
  audio_narration_url TEXT,
  audio_narration_local_path TEXT,
  privacy TEXT NOT NULL DEFAULT 'public' CHECK(privacy IN ('public', 'family_only', 'private')),
  original_privacy TEXT,
  is_auto_privated INTEGER NOT NULL DEFAULT 0,
  ai_metadata TEXT, -- JSON object
  location_id TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  is_favorited_by_user INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('synced', 'pending', 'uploading', 'failed', 'conflict')),
  etag TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  uploaded_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_family_objects_user_type_privacy ON family_objects(user_id, object_type, privacy);
CREATE INDEX IF NOT EXISTS idx_family_objects_sync_status ON family_objects(sync_status);

-- Attachments Table
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY NOT NULL,
  story_id TEXT NOT NULL,
  family_object_id TEXT,
  file_url TEXT,
  file_local_path TEXT,
  file_type TEXT NOT NULL CHECK(file_type IN ('photo', 'video', 'document')),
  file_format TEXT,
  file_size_bytes INTEGER,
  timestamp_seconds INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_encrypted INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (family_object_id) REFERENCES family_objects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_story_order ON attachments(story_id, display_order);
CREATE INDEX IF NOT EXISTS idx_attachments_timestamp ON attachments(timestamp_seconds);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  place_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  source TEXT NOT NULL CHECK(source IN ('gps', 'manual', 'ai_extracted')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_locations_place_name ON locations(place_name);

-- Family Groups Table
CREATE TABLE IF NOT EXISTS family_groups (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Family Group Memberships Table
CREATE TABLE IF NOT EXISTS family_group_memberships (
  id TEXT PRIMARY KEY NOT NULL,
  family_group_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner', 'admin', 'member')),
  joined_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (family_group_id) REFERENCES family_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(family_group_id, user_id)
);

-- Family Group Invitations Table
CREATE TABLE IF NOT EXISTS family_group_invitations (
  id TEXT PRIMARY KEY NOT NULL,
  family_group_id TEXT NOT NULL,
  invited_by_user_id TEXT NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'canceled')),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  responded_at INTEGER,
  FOREIGN KEY (family_group_id) REFERENCES family_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invitee_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_email_status ON family_group_invitations(invitee_email, status);
CREATE INDEX IF NOT EXISTS idx_invitations_user_status ON family_group_invitations(invitee_user_id, status);

-- Family Tree Members Table
CREATE TABLE IF NOT EXISTS family_tree_members (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  birth_date TEXT,
  death_date TEXT,
  profile_photo_url TEXT,
  biographical_info TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_family_tree_members_user_name ON family_tree_members(user_id, name);

-- Family Relationships Table
CREATE TABLE IF NOT EXISTS family_relationships (
  id TEXT PRIMARY KEY NOT NULL,
  person1_id TEXT NOT NULL,
  person2_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK(relationship_type IN ('parent-child', 'spouse', 'sibling')),
  confidence TEXT NOT NULL DEFAULT 'user_confirmed' CHECK(confidence IN ('user_confirmed', 'ai_suggested')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (person1_id) REFERENCES family_tree_members(id) ON DELETE CASCADE,
  FOREIGN KEY (person2_id) REFERENCES family_tree_members(id) ON DELETE CASCADE,
  UNIQUE(person1_id, person2_id, relationship_type)
);

-- Person Tags Table
CREATE TABLE IF NOT EXISTS person_tags (
  id TEXT PRIMARY KEY NOT NULL,
  family_object_id TEXT NOT NULL,
  family_tree_member_id TEXT,
  name TEXT NOT NULL,
  tag_x REAL NOT NULL,
  tag_y REAL NOT NULL,
  audio_narration_url TEXT,
  audio_narration_local_path TEXT,
  ai_confidence REAL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (family_object_id) REFERENCES family_objects(id) ON DELETE CASCADE,
  FOREIGN KEY (family_tree_member_id) REFERENCES family_tree_members(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_person_tags_object ON person_tags(family_object_id);
CREATE INDEX IF NOT EXISTS idx_person_tags_member ON person_tags(family_tree_member_id);

-- Likes Table
CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  likeable_type TEXT NOT NULL CHECK(likeable_type IN ('story', 'family_object')),
  likeable_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, likeable_type, likeable_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_likeable ON likes(likeable_type, likeable_id);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  favoritable_type TEXT NOT NULL CHECK(favoritable_type IN ('story', 'family_object')),
  favoritable_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, favoritable_type, favoritable_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites(user_id, created_at);

-- Content Reports Table
CREATE TABLE IF NOT EXISTS content_reports (
  id TEXT PRIMARY KEY NOT NULL,
  tracking_id TEXT UNIQUE NOT NULL,
  reporting_user_id TEXT NOT NULL,
  reported_content_type TEXT NOT NULL CHECK(reported_content_type IN ('story', 'family_object')),
  reported_content_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK(reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  reason_details TEXT,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK(moderation_status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  is_hidden_by_reporter INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  reviewed_at INTEGER,
  FOREIGN KEY (reporting_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_reports_tracking ON content_reports(tracking_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_user ON content_reports(reporting_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(reported_content_type, reported_content_id);

-- Tutorials Table
CREATE TABLE IF NOT EXISTS tutorials (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('recording_basics', 'interview_techniques', 'app_features', 'being_a_griot')),
  duration_seconds INTEGER NOT NULL,
  display_order INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Tutorial Progress Table
CREATE TABLE IF NOT EXISTS tutorial_progress (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  tutorial_id TEXT NOT NULL,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0,
  last_viewed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tutorial_id) REFERENCES tutorials(id) ON DELETE CASCADE,
  UNIQUE(user_id, tutorial_id)
);

-- Interview Questions Table
CREATE TABLE IF NOT EXISTS interview_questions (
  id TEXT PRIMARY KEY NOT NULL,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('childhood', 'family_origins', 'significant_events', 'cultural_traditions', 'migration', 'work')),
  keywords TEXT NOT NULL, -- JSON array
  question_type TEXT NOT NULL CHECK(question_type IN ('starter', 'follow_up')),
  display_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_category_type ON interview_questions(category, question_type);

-- Guided Interview Sessions Table
CREATE TABLE IF NOT EXISTS guided_interview_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  story_id TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 0,
  starter_question_id TEXT,
  suggested_questions TEXT, -- JSON array of question IDs
  covered_questions TEXT, -- JSON array of question IDs
  skipped_questions TEXT, -- JSON array of question IDs
  speech_transcript TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (starter_question_id) REFERENCES interview_questions(id) ON DELETE SET NULL
);

-- Ask the Griot Sessions Table
CREATE TABLE IF NOT EXISTS ask_the_griot_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  messages TEXT NOT NULL, -- JSON array
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Source Citations Table
CREATE TABLE IF NOT EXISTS source_citations (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  message_index INTEGER NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('story', 'family_object', 'external_database')),
  source_id TEXT,
  source_title TEXT NOT NULL,
  source_date TEXT,
  excerpt TEXT,
  timestamp_seconds INTEGER,
  FOREIGN KEY (session_id) REFERENCES ask_the_griot_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_source_citations_session ON source_citations(session_id, message_index);

-- Interview Highlights Table
CREATE TABLE IF NOT EXISTS interview_highlights (
  id TEXT PRIMARY KEY NOT NULL,
  story_id TEXT NOT NULL,
  highlight_url TEXT,
  highlight_local_path TEXT,
  duration_seconds INTEGER,
  segments TEXT, -- JSON array
  generation_status TEXT NOT NULL DEFAULT 'pending' CHECK(generation_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Location Notifications Table
CREATE TABLE IF NOT EXISTS location_notifications (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  radius_meters INTEGER NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('story', 'family_object', 'both')),
  notification_text TEXT NOT NULL,
  last_triggered_at INTEGER,
  is_enabled INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_location_notifications_user_enabled ON location_notifications(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_location_notifications_location ON location_notifications(location_id);

-- Upload Chunks Table
CREATE TABLE IF NOT EXISTS upload_chunks (
  id TEXT PRIMARY KEY NOT NULL,
  content_type TEXT NOT NULL CHECK(content_type IN ('story', 'family_object', 'attachment')),
  content_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  upload_url TEXT,
  is_uploaded INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  uploaded_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_upload_chunks_content ON upload_chunks(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_upload_chunks_uploaded ON upload_chunks(is_uploaded);

-- Sync Queue Table
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('story', 'family_object', 'attachment', 'family_tree_member', 'like', 'favorite')),
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
  payload TEXT NOT NULL, -- JSON object
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  last_retry_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_entity_operation ON sync_queue(entity_type, operation);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
