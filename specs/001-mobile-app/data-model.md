# Data Model: Griot and Grits Mobile App

**Branch**: `001-mobile-app` | **Date**: 2026-01-06

This document defines the core entities and their relationships for the mobile application's local SQLite database and backend API integration.

---

## Core Entities

### User

Represents an individual using the app to record, view, and share family stories.

**Fields**:
- `id` (string, primary key): Unique identifier
- `email` (string, unique): User email address
- `name` (string): Display name
- `profile_photo_url` (string, nullable): Profile picture
- `membership_tier` (enum: 'free', 'paid'): Subscription level
- `storage_quota_bytes` (integer): Total storage limit based on tier
- `storage_used_bytes` (integer): Current storage usage
- `linked_auth_providers` (json): Array of linked auth methods (email, google, apple, facebook)
- `preferences` (json): User settings (wifi_only_uploads, location_notifications, etc.)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
- Has many: Stories, FamilyObjects, FamilyGroupMemberships, Likes, Favorites, ContentReports
- Belongs to many: FamilyGroups (through FamilyGroupMemberships)

---

### Story

Represents a recorded family history video with metadata.

**Fields**:
- `id` (string, primary key): Unique identifier
- `user_id` (string, foreign key): Story owner
- `title` (string): Story title
- `description` (text, nullable): Story description
- `video_url` (string, nullable): URL to video file (after upload)
- `video_local_path` (string, nullable): Local file path (before upload)
- `thumbnail_url` (string, nullable): Thumbnail image URL
- `duration_seconds` (integer): Video duration
- `quality` (enum: '240p', '480p', '720p', '1080p'): Recording quality
- `privacy` (enum: 'public', 'family_only', 'private'): Current privacy setting
- `original_privacy` (enum, nullable): Original privacy before auto-privated due to quota
- `is_auto_privated` (boolean, default: false): Whether privacy was changed due to quota
- `processing_status` (enum: 'pending', 'processing', 'completed', 'failed'): AI processing state
- `ai_metadata` (json, nullable): AI-generated tags, topics, people, places
- `chunk_count` (integer, default: 1): Number of upload chunks
- `chunk_info` (json, nullable): Chunk reconstruction metadata for backend
- `location_id` (string, nullable, foreign key): Associated location
- `like_count` (integer, default: 0): Number of likes
- `is_favorited_by_user` (boolean, default: false): User's favorite status
- `sync_status` (enum: 'synced', 'pending', 'uploading', 'failed', 'conflict'): Sync state
- `etag` (string, nullable): For conflict detection
- `created_at` (timestamp): Recording date
- `updated_at` (timestamp)
- `uploaded_at` (timestamp, nullable)
- `cached_at` (timestamp, nullable): Last cache update

**Relationships**:
- Belongs to: User, Location (optional)
- Has many: Attachments, Likes, Favorites, ContentReports, InterviewHighlights, GuidedInterviewSessions
- Belongs to many: FamilyTreeMembers (through content links)

**Indexes**:
- `user_id`, `privacy`, `created_at` (for feed queries)
- `sync_status` (for offline queue)
- `processing_status` (for pending AI processing)

---

### FamilyObject

Represents an uploaded family artifact (photo, document, or video) with audio narration.

**Fields**:
- `id` (string, primary key): Unique identifier
- `user_id` (string, foreign key): Object owner
- `title` (string): Object title
- `description` (text, nullable): Object description
- `object_url` (string, nullable): URL to object file
- `object_local_path` (string, nullable): Local file path
- `object_type` (enum: 'photo', 'document', 'video'): Type of object
- `file_format` (string): File extension (jpg, pdf, mp4, etc.)
- `thumbnail_url` (string, nullable): Thumbnail for documents/videos
- `audio_narration_url` (string, nullable): URL to primary audio narration
- `audio_narration_local_path` (string, nullable): Local audio file path
- `privacy` (enum: 'public', 'family_only', 'private'): Privacy setting
- `original_privacy` (enum, nullable): Original privacy before auto-privated
- `is_auto_privated` (boolean, default: false)
- `ai_metadata` (json, nullable): AI-generated tags and metadata
- `location_id` (string, nullable, foreign key): Associated location
- `like_count` (integer, default: 0)
- `is_favorited_by_user` (boolean, default: false)
- `sync_status` (enum: 'synced', 'pending', 'uploading', 'failed', 'conflict')
- `etag` (string, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `uploaded_at` (timestamp, nullable)

**Relationships**:
- Belongs to: User, Location (optional)
- Has many: PersonTags (for multiple narrations), Likes, Favorites
- Belongs to many: Stories (as Attachments with timestamps), FamilyTreeMembers (through content links)

**Indexes**:
- `user_id`, `object_type`, `privacy`
- `sync_status`

---

### Attachment

Represents supporting materials attached to a story (photos, videos, documents).

**Fields**:
- `id` (string, primary key): Unique identifier
- `story_id` (string, foreign key): Parent story
- `family_object_id` (string, nullable, foreign key): Reference to FamilyObject if reused
- `file_url` (string, nullable): URL to file
- `file_local_path` (string, nullable): Local file path
- `file_type` (enum: 'photo', 'video', 'document'): Attachment type
- `file_format` (string): File extension
- `file_size_bytes` (integer): File size
- `timestamp_seconds` (integer, nullable): Timestamp in interview for overlay
- `display_order` (integer, default: 0): Order in attachment list
- `is_encrypted` (boolean, default: true)
- `created_at` (timestamp)

**Relationships**:
- Belongs to: Story
- Optionally references: FamilyObject

**Indexes**:
- `story_id`, `display_order`
- `timestamp_seconds` (for interactive overlays)

---

### Location

Represents geographic information associated with stories and family objects.

**Fields**:
- `id` (string, primary key): Unique identifier
- `latitude` (float): GPS latitude
- `longitude` (float): GPS longitude
- `place_name` (string, nullable): Human-readable location
- `address` (string, nullable): Full address
- `city` (string, nullable)
- `state` (string, nullable)
- `country` (string, nullable)
- `source` (enum: 'gps', 'manual', 'ai_extracted'): How location was determined
- `created_at` (timestamp)

**Relationships**:
- Has many: Stories, FamilyObjects, LocationNotifications

**Indexes**:
- `latitude`, `longitude` (for geofencing queries)
- `place_name` (for search)

---

### FamilyGroup

Represents a collection of related users who share family stories.

**Fields**:
- `id` (string, primary key): Unique identifier
- `name` (string): Family group name
- `created_by_user_id` (string, foreign key): Creator
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
- Has many: FamilyGroupMemberships, FamilyGroupInvitations
- Belongs to many: Users (through FamilyGroupMemberships)

---

### FamilyGroupMembership

Join table for Users and FamilyGroups.

**Fields**:
- `id` (string, primary key)
- `family_group_id` (string, foreign key)
- `user_id` (string, foreign key)
- `role` (enum: 'owner', 'admin', 'member'): Membership role
- `joined_at` (timestamp)

**Indexes**:
- Unique: `family_group_id`, `user_id`

---

### FamilyGroupInvitation

Represents pending invitations to join a family group.

**Fields**:
- `id` (string, primary key)
- `family_group_id` (string, foreign key)
- `invited_by_user_id` (string, foreign key): Inviter
- `invitee_email` (string): Email of invitee
- `invitee_user_id` (string, nullable, foreign key): If user exists
- `status` (enum: 'pending', 'accepted', 'declined', 'canceled')
- `expires_at` (timestamp)
- `created_at` (timestamp)
- `responded_at` (timestamp, nullable)

**Indexes**:
- `invitee_email`, `status`
- `invitee_user_id`, `status`

---

### FamilyTreeMember

Represents an individual in the family tree.

**Fields**:
- `id` (string, primary key): Unique identifier
- `user_id` (string, foreign key): Tree owner
- `name` (string): Member's name
- `birth_date` (date, nullable)
- `death_date` (date, nullable)
- `profile_photo_url` (string, nullable)
- `biographical_info` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
- Belongs to: User
- Has many: FamilyRelationships (as person1 or person2), PersonTags
- Belongs to many: Stories, FamilyObjects (through content links)

**Indexes**:
- `user_id`, `name`

---

### FamilyRelationship

Represents a connection between two family tree members.

**Fields**:
- `id` (string, primary key)
- `person1_id` (string, foreign key): First family member
- `person2_id` (string, foreign key): Second family member
- `relationship_type` (enum: 'parent-child', 'spouse', 'sibling'): Relationship type
- `confidence` (enum: 'user_confirmed', 'ai_suggested'): Source of relationship
- `created_at` (timestamp)

**Relationships**:
- Belongs to: FamilyTreeMember (twice: person1, person2)

**Indexes**:
- Unique: `person1_id`, `person2_id`, `relationship_type`

---

### PersonTag

Represents a tagged individual in a photo with associated narration.

**Fields**:
- `id` (string, primary key)
- `family_object_id` (string, foreign key): Photo containing the tag
- `family_tree_member_id` (string, nullable, foreign key): Linked family member
- `name` (string): Person's name
- `tag_x` (float): X coordinate (0-1 normalized)
- `tag_y` (float): Y coordinate (0-1 normalized)
- `audio_narration_url` (string, nullable): Person-specific narration URL
- `audio_narration_local_path` (string, nullable)
- `ai_confidence` (float, nullable): AI detection confidence (0-1)
- `created_at` (timestamp)

**Relationships**:
- Belongs to: FamilyObject
- Optionally belongs to: FamilyTreeMember

**Indexes**:
- `family_object_id`
- `family_tree_member_id`

---

### Like

Represents a user's positive engagement with content.

**Fields**:
- `id` (string, primary key)
- `user_id` (string, foreign key)
- `likeable_type` (enum: 'story', 'family_object'): Polymorphic type
- `likeable_id` (string): Polymorphic ID
- `created_at` (timestamp)

**Indexes**:
- Unique: `user_id`, `likeable_type`, `likeable_id`
- `likeable_type`, `likeable_id` (for count queries)

---

### Favorite

Represents a user's saved content for later viewing.

**Fields**:
- `id` (string, primary key)
- `user_id` (string, foreign key)
- `favoritable_type` (enum: 'story', 'family_object'): Polymorphic type
- `favoritable_id` (string): Polymorphic ID
- `created_at` (timestamp)

**Indexes**:
- Unique: `user_id`, `favoritable_type`, `favoritable_id`
- `user_id`, `created_at` (for favorites feed)

---

### ContentReport

Represents a user-submitted report of inappropriate content.

**Fields**:
- `id` (string, primary key)
- `tracking_id` (string, unique): User-facing tracking number
- `reporting_user_id` (string, foreign key)
- `reported_content_type` (enum: 'story', 'family_object')
- `reported_content_id` (string)
- `reason` (enum: 'spam', 'harassment', 'inappropriate', 'other'): Report reason
- `reason_details` (text, nullable): Additional context
- `moderation_status` (enum: 'pending', 'reviewed', 'actioned', 'dismissed')
- `is_hidden_by_reporter` (boolean, default: false): Reporter's local hide status
- `created_at` (timestamp)
- `reviewed_at` (timestamp, nullable)

**Indexes**:
- `tracking_id`
- `reporting_user_id`
- `reported_content_type`, `reported_content_id`

---

### Tutorial

Represents educational video content.

**Fields**:
- `id` (string, primary key)
- `title` (string): Tutorial title
- `description` (text): Tutorial description
- `video_url` (string): Video file URL
- `thumbnail_url` (string)
- `category` (enum: 'recording_basics', 'interview_techniques', 'app_features', 'being_a_griot')
- `duration_seconds` (integer)
- `display_order` (integer): Order in category
- `created_at` (timestamp)

**Relationships**:
- Has many: TutorialProgress (user viewing progress)

---

### TutorialProgress

Tracks user progress through tutorials.

**Fields**:
- `id` (string, primary key)
- `user_id` (string, foreign key)
- `tutorial_id` (string, foreign key)
- `progress_seconds` (integer, default: 0): Last viewed position
- `is_completed` (boolean, default: false)
- `last_viewed_at` (timestamp)

**Indexes**:
- Unique: `user_id`, `tutorial_id`

---

### InterviewQuestion

Template questions for guided interview mode.

**Fields**:
- `id` (string, primary key)
- `question_text` (text): The question
- `category` (enum: 'childhood', 'family_origins', 'significant_events', 'cultural_traditions', 'migration', 'work')
- `keywords` (json): Array of trigger keywords
- `question_type` (enum: 'starter', 'follow_up')
- `display_order` (integer)

**Indexes**:
- `category`, `question_type`

---

### GuidedInterviewSession

Represents a single guided recording session.

**Fields**:
- `id` (string, primary key)
- `story_id` (string, foreign key): Associated story
- `is_enabled` (boolean): Whether guided mode was active
- `starter_question_id` (string, nullable, foreign key): Selected starter
- `suggested_questions` (json): Array of question IDs suggested during session
- `covered_questions` (json): Array of question IDs user asked
- `skipped_questions` (json): Array of question IDs user dismissed
- `speech_transcript` (text, nullable): Full transcript (for AI enhancement)
- `created_at` (timestamp)

**Relationships**:
- Belongs to: Story
- References: InterviewQuestion (starter)

---

### AskTheGriotSession

Represents a conversation with the Ask the Griot chatbot.

**Fields**:
- `id` (string, primary key)
- `user_id` (string, foreign key)
- `messages` (json): Array of {role: 'user'|'assistant', content: string, sources: []}
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Relationships**:
- Belongs to: User
- References many: Stories, FamilyObjects (as sources in messages)

---

### SourceCitation

Represents a reference used by Ask the Griot.

**Fields**:
- `id` (string, primary key)
- `session_id` (string, foreign key): Griot session
- `message_index` (integer): Which message in session
- `source_type` (enum: 'story', 'family_object', 'external_database')
- `source_id` (string, nullable): If internal content
- `source_title` (string): Display title
- `source_date` (date, nullable)
- `excerpt` (text, nullable): Relevant excerpt
- `timestamp_seconds` (integer, nullable): For video/audio sources

**Indexes**:
- `session_id`, `message_index`

---

### InterviewHighlight

Represents a condensed version of an interview.

**Fields**:
- `id` (string, primary key)
- `story_id` (string, foreign key): Source interview
- `highlight_url` (string, nullable): URL to highlight video
- `highlight_local_path` (string, nullable)
- `duration_seconds` (integer): Highlight duration
- `segments` (json): Array of {start: seconds, end: seconds, reason: string}
- `generation_status` (enum: 'pending', 'processing', 'completed', 'failed')
- `created_at` (timestamp)

**Relationships**:
- Belongs to: Story

---

### LocationNotification

Represents a geofenced notification trigger.

**Fields**:
- `id` (string, primary key)
- `user_id` (string, foreign key)
- `location_id` (string, foreign key)
- `radius_meters` (integer): Geofence radius
- `content_type` (enum: 'story', 'family_object', 'both'): What triggers notification
- `notification_text` (string): Notification content
- `last_triggered_at` (timestamp, nullable)
- `is_enabled` (boolean, default: false)

**Relationships**:
- Belongs to: User, Location

**Indexes**:
- `user_id`, `is_enabled`
- `location_id`

---

### UploadChunk

Tracks chunked upload progress for resumability.

**Fields**:
- `id` (string, primary key)
- `content_type` (enum: 'story', 'family_object', 'attachment'): What's being uploaded
- `content_id` (string): Reference to content
- `file_path` (string): Local file being uploaded
- `chunk_index` (integer): Current chunk number
- `total_chunks` (integer): Total chunks for file
- `upload_url` (string, nullable): TUS upload URL
- `is_uploaded` (boolean, default: false)
- `retry_count` (integer, default: 0)
- `created_at` (timestamp)
- `uploaded_at` (timestamp, nullable)

**Indexes**:
- `content_type`, `content_id`
- `is_uploaded` (for pending chunks)

---

### SyncQueue

Offline operation queue for sync when online.

**Fields**:
- `id` (integer, primary key, autoincrement)
- `entity_type` (enum: 'story', 'family_object', 'attachment', 'family_tree_member', 'like', 'favorite')
- `entity_id` (string): Reference to entity
- `operation` (enum: 'create', 'update', 'delete')
- `payload` (json): Data to sync
- `retry_count` (integer, default: 0)
- `last_error` (text, nullable)
- `created_at` (timestamp)
- `last_retry_at` (timestamp, nullable)

**Indexes**:
- `entity_type`, `operation`
- `created_at` (FIFO processing)

---

## Relationships Diagram

```
User
 ├─── Stories (1:many)
 ├─── FamilyObjects (1:many)
 ├─── FamilyGroupMemberships (1:many)
 ├─── FamilyTreeMembers (1:many)
 ├─── Likes (1:many)
 ├─── Favorites (1:many)
 └─── AskTheGriotSessions (1:many)

Story
 ├─── Attachments (1:many)
 ├─── Location (many:1, optional)
 ├─── GuidedInterviewSession (1:1, optional)
 ├─── InterviewHighlight (1:1, optional)
 └─── FamilyTreeMembers (many:many via content_links)

FamilyObject
 ├─── PersonTags (1:many)
 ├─── Location (many:1, optional)
 └─── FamilyTreeMembers (many:many via content_links)

FamilyTreeMember
 ├─── FamilyRelationships (1:many as person1 or person2)
 ├─── Stories (many:many via content_links)
 └─── FamilyObjects (many:many via content_links)

FamilyGroup
 ├─── FamilyGroupMemberships (1:many)
 └─── FamilyGroupInvitations (1:many)
```

---

## SQLite Schema (Simplified)

```sql
-- Core content tables
CREATE TABLE users (...);
CREATE TABLE stories (...);
CREATE TABLE family_objects (...);
CREATE TABLE attachments (...);
CREATE TABLE locations (...);

-- Family tree tables
CREATE TABLE family_tree_members (...);
CREATE TABLE family_relationships (...);
CREATE TABLE person_tags (...);

-- Family group tables
CREATE TABLE family_groups (...);
CREATE TABLE family_group_memberships (...);
CREATE TABLE family_group_invitations (...);

-- Engagement tables
CREATE TABLE likes (...);
CREATE TABLE favorites (...);
CREATE TABLE content_reports (...);

-- Guided interview tables
CREATE TABLE interview_questions (...);
CREATE TABLE guided_interview_sessions (...);

-- Ask the Griot tables
CREATE TABLE ask_the_griot_sessions (...);
CREATE TABLE source_citations (...);

-- Tutorial tables
CREATE TABLE tutorials (...);
CREATE TABLE tutorial_progress (...);

-- Highlights
CREATE TABLE interview_highlights (...);

-- Location notifications
CREATE TABLE location_notifications (...);

-- Offline sync tables
CREATE TABLE upload_chunks (...);
CREATE TABLE sync_queue (...);

-- Indexes
CREATE INDEX idx_stories_user_privacy ON stories(user_id, privacy, created_at);
CREATE INDEX idx_stories_sync_status ON stories(sync_status);
-- ... (additional indexes as noted in entity definitions)
```

---

## Data Flow

### Offline Recording Flow
1. User records video → Story created with `sync_status: 'pending'`
2. Video saved to encrypted local file system
3. Story added to SyncQueue
4. When online: UploadChunks created, chunked upload begins
5. On upload complete: Story `sync_status: 'synced'`, video_url updated

### Discovery Feed Flow
1. User opens feed → Query Stories WHERE privacy='public' ORDER BY created_at DESC
2. Infinite scroll → Cursor-based pagination via API
3. Like story → Create Like, increment story.like_count
4. Optimistic UI update → Local state updated immediately
5. Background sync → API call queued, retry on failure

### Family Tree Flow
1. User adds family member → FamilyTreeMember created
2. Define relationships → FamilyRelationship records created
3. Link story to member → Content link (join table) created
4. View member → Query all linked Stories and FamilyObjects
5. AI detection → Suggests matches, user confirms

---

This data model supports all functional requirements (FR-001 to FR-242) and success criteria (SC-001 to SC-075) defined in the specification.
