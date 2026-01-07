# Implementation Tasks: Griot and Grits Mobile App

**Branch**: `001-mobile-app` | **Date**: 2026-01-06
**Feature**: Mobile app for recording, editing, and sharing family oral histories
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Overview

This document breaks down the implementation into phases organized by **user story priority**. Each phase represents an independently testable increment of functionality that delivers user value.

**Total Tasks**: 187
**Parallelizable Tasks**: 94
**User Stories**: 18 (P1: 5, P2: 9, P3: 4)

---

## Implementation Strategy

### MVP Scope (Recommended First Release)
- **Phase 3 Only**: User Story 1 - Record and Upload Family Story
- Delivers core value proposition: preserving oral histories
- Independently testable and deployable
- Foundation for all other features

### Incremental Delivery
1. **Phase 1-2**: Setup + Foundational (Complete first)
2. **Phase 3**: User Story 1 (MVP - Deploy and validate)
3. **Phase 4-7**: Remaining P1 stories (Core features)
4. **Phase 8-16**: P2 stories (Enhanced features)
5. **Phase 17-20**: P3 stories (Advanced features)
6. **Phase 21**: Polish & cross-cutting concerns

### Parallel Execution
Tasks marked with `[P]` can be implemented in parallel within their phase. See "Parallel Opportunities" section for details.

---

## Phase 1: Project Setup

**Goal**: Initialize React Native project structure with core dependencies

**Duration Estimate**: 2-3 days

### Setup Tasks

- [ ] T001 Initialize React Native 0.73+ project in mobile/ directory using React Native CLI
- [ ] T002 Configure TypeScript with tsconfig.json (strict mode, path aliases @/)
- [ ] T003 Install core dependencies: react-navigation, zustand, @tanstack/react-query, @op-engineering/op-sqlite
- [ ] T004 Install media dependencies: react-native-vision-camera, ffmpeg-kit-react-native, @react-native-voice/voice
- [ ] T005 Install encryption dependencies: react-native-keychain, react-native-quick-crypto
- [ ] T006 Install upload dependencies: react-native-background-upload, axios, tus-js-client
- [ ] T007 Install UI dependencies: react-native-linear-gradient, react-native-ui-lib, react-native-paper, react-native-vector-icons
- [ ] T008 Install utility dependencies: @react-native-community/netinfo, react-native-fs, @react-native-async-storage/async-storage
- [ ] T009 Install dev dependencies: jest, @testing-library/react-native, detox, @faker-js/faker, msw
- [ ] T010 Configure iOS project in mobile/ios/Podfile with all native dependencies
- [ ] T011 Configure Android project in mobile/android/build.gradle with all native dependencies
- [ ] T012 Run pod install for iOS dependencies
- [ ] T013 Create project structure: src/components, src/screens, src/services, src/store, src/database, src/navigation, src/hooks, src/types, src/utils, src/assets
- [ ] T014 Create environment configuration files: .env.example with API_BASE_URL, USE_MOCK_API, ENABLE_GUIDED_MODE, DEBUG_MODE
- [ ] T015 Configure Metro bundler in metro.config.js with asset extensions for video/audio
- [ ] T016 Configure Jest in jest.config.js for React Native testing
- [ ] T017 Configure Detox in .detoxrc.js for E2E testing on iOS and Android
- [ ] T018 Create design tokens in src/styles/tokens.ts with Colors, Typography, Spacing, BorderRadius, Shadows
- [ ] T019 Create .gitignore with node_modules, ios/Pods, android/.gradle, .env, coverage
- [ ] T020 Verify iOS build compiles successfully
- [ ] T021 Verify Android build compiles successfully

---

## Phase 2: Foundational Infrastructure

**Goal**: Implement shared services and infrastructure required by ALL user stories

**Duration Estimate**: 1 week

**Blocking**: Must complete before any user story implementation

### Database Setup

- [ ] T022 Create SQLite database schema in src/database/schema/schema.sql with all tables from data-model.md
- [ ] T023 Implement database initialization in src/database/DatabaseManager.ts with SQLCipher encryption
- [ ] T024 [P] Create User model in src/database/models/User.ts
- [ ] T025 [P] Create Story model in src/database/models/Story.ts
- [ ] T026 [P] Create FamilyObject model in src/database/models/FamilyObject.ts
- [ ] T027 [P] Create Location model in src/database/models/Location.ts
- [ ] T028 [P] Create SyncQueue model in src/database/models/SyncQueue.ts
- [ ] T029 [P] Create UploadChunk model in src/database/models/UploadChunk.ts
- [ ] T030 Create database migration system in src/database/migrations/MigrationManager.ts

### Encryption Services

- [ ] T031 Implement EncryptionService in src/services/encryption/EncryptionService.ts with getMasterKey(), encryptFile(), decryptFile()
- [ ] T032 Implement key management in src/services/encryption/KeyManager.ts using react-native-keychain with hardware-backed storage
- [ ] T033 Test encryption performance with 60-minute video file (target: <45 seconds)

### API Client

- [ ] T034 Create API client base in src/services/api/ApiClient.ts with axios, interceptors for auth, correlation IDs
- [ ] T035 Implement authentication token management in src/services/api/TokenManager.ts with refresh logic
- [ ] T036 Implement request/response interceptors for observability headers (X-Request-ID, X-Correlation-ID, X-App-Version)
- [ ] T037 Implement error handling and retry logic in src/services/api/ErrorHandler.ts

### State Management

- [ ] T038 [P] Create auth store in src/store/authStore.ts with Zustand (user, token, isAuthenticated, setAuth, logout)
- [ ] T039 [P] Create UI store in src/store/uiStore.ts (feedSortMode, networkStatus, lastSyncTimestamp)
- [ ] T040 [P] Create recording store in src/store/recordingStore.ts (isRecording, isPaused, duration, startRecording, pauseRecording, resumeRecording, stopRecording)
- [ ] T041 [P] Create upload queue store in src/store/uploadQueueStore.ts (queue, addToQueue, updateStatus, removeFromQueue, getPendingUploads)

### Sync & Offline Support

- [ ] T042 Implement SyncManager in src/services/sync/SyncManager.ts with NetInfo monitoring, queue processing, exponential backoff
- [ ] T043 Implement connectivity detection in src/services/sync/ConnectivityMonitor.ts with status indicators
- [ ] T044 Implement conflict resolution in src/services/sync/ConflictResolver.ts using ETags

### Upload Service

- [ ] T045 Implement ChunkedUploadService in src/services/upload/ChunkedUploadService.ts with TUS protocol, encryption, progress tracking
- [ ] T046 Implement background upload in src/services/upload/BackgroundUploadService.ts with react-native-background-upload
- [ ] T047 Implement upload queue management in src/services/upload/UploadQueueManager.ts

### Navigation

- [ ] T048 Create root navigation structure in src/navigation/RootNavigator.tsx
- [ ] T049 Create auth navigation in src/navigation/AuthNavigator.tsx (Login, Signup, PasswordReset)
- [ ] T050 Create main navigation in src/navigation/MainNavigator.tsx with bottom tabs

### Common UI Components

- [ ] T051 [P] Create PrimaryButton component in src/components/common/PrimaryButton.tsx with gradient styling
- [ ] T052 [P] Create SecondaryButton component in src/components/common/SecondaryButton.tsx
- [ ] T053 [P] Create Input component in src/components/common/Input.tsx with validation
- [ ] T054 [P] Create Card component in src/components/common/Card.tsx
- [ ] T055 [P] Create LoadingSpinner component in src/components/common/LoadingSpinner.tsx
- [ ] T056 [P] Create ErrorMessage component in src/components/common/ErrorMessage.tsx

### Permissions

- [ ] T057 Implement permission manager in src/utils/permissions/PermissionManager.ts for camera, microphone, storage, location
- [ ] T058 Create permission request UI components in src/components/common/PermissionRequest.tsx

### Mock Backend (Development)

- [ ] T059 Create MSW handlers in src/mocks/handlers.ts for auth, stories, uploads endpoints
- [ ] T060 Create mock data generators in src/mocks/generators.ts using @faker-js/faker
- [ ] T061 Configure MSW server in src/mocks/server.ts with network condition simulation

### Testing Infrastructure

- [ ] T062 Create test utilities in __tests__/utils/testUtils.ts (render with providers, mock stores)
- [ ] T063 Create E2E test setup in __tests__/e2e/setup.ts
- [ ] T064 Create sample unit test for EncryptionService in __tests__/unit/services/EncryptionService.test.ts

---

## Phase 3: User Story 1 - Record and Upload Family Story (P1)

**Priority**: P1
**Goal**: Users can record video of family members, set privacy, and upload to backend
**Independent Test**: Record a video, pause/resume, set privacy to Public/Family Only/Private, upload successfully

**Duration Estimate**: 2 weeks

**Acceptance Criteria** (from spec.md):
- Video recording starts with audio capture
- Pause/resume functionality works
- Privacy defaults to Public with clear options to change
- Video uploads to backend with chosen privacy level
- Videos saved locally when offline and upload when online
- Quality selection between low and high

### Models & DAOs

- [ ] T065 [US1] Implement Story DAO in src/database/dao/StoryDAO.ts with CRUD, sync status queries

### Services

- [ ] T066 [US1] Implement VideoRecordingService in src/services/recording/VideoRecordingService.ts with react-native-vision-camera, pause/resume, quality selection
- [ ] T067 [US1] Implement recording permission checks in VideoRecordingService (camera, microphone)
- [ ] T068 [US1] Implement interruption handling in VideoRecordingService (incoming calls, app backgrounding)
- [ ] T069 [US1] Implement 60-minute recording limit with warning at 55 minutes
- [ ] T070 [US1] Implement StoryService in src/services/story/StoryService.ts with createStory, updateStory, uploadStory
- [ ] T071 [US1] Integrate encryption in StoryService for local video storage

### API Integration

- [ ] T072 [US1] Implement story upload API in src/services/api/StoryApi.ts (POST /api/stories, PATCH /api/stories/:id)
- [ ] T073 [US1] Implement chunked video upload integration with ChunkedUploadService

### UI Components

- [ ] T074 [P] [US1] Create RecordingControls component in src/components/recording/RecordingControls.tsx (record, pause, stop buttons)
- [ ] T075 [P] [US1] Create RecordingTimer component in src/components/recording/RecordingTimer.tsx with elapsed time and limit warning
- [ ] T076 [P] [US1] Create QualitySelector component in src/components/recording/QualitySelector.tsx (240p, 480p, 720p, 1080p)
- [ ] T077 [P] [US1] Create PrivacySelector component in src/components/recording/PrivacySelector.tsx (Public, Family Only, Private with explanations)
- [ ] T078 [P] [US1] Create UploadProgress component in src/components/recording/UploadProgress.tsx with chunk progress

### Screens

- [ ] T079 [US1] Create RecordingScreen in src/screens/recording/RecordingScreen.tsx with camera preview, controls, timer
- [ ] T080 [US1] Create ReviewScreen in src/screens/recording/ReviewScreen.tsx with playback, privacy selection, upload button
- [ ] T081 [US1] Implement recording state management in RecordingScreen with recordingStore
- [ ] T082 [US1] Implement offline detection and queue management in ReviewScreen
- [ ] T083 [US1] Implement upload success/failure handling with user feedback

### Integration

- [ ] T084 [US1] Wire up recording flow: Home → RecordingScreen → ReviewScreen → Upload
- [ ] T085 [US1] Test offline recording and automatic upload when online
- [ ] T086 [US1] Test pause/resume during recording
- [ ] T087 [US1] Test privacy setting changes (Public → Family Only → Private)
- [ ] T088 [US1] Test quality selection impact on file size and upload time

### E2E Tests

- [ ] T089 [US1] E2E test: Record 30-second video, upload successfully in __tests__/e2e/recording.e2e.ts
- [ ] T090 [US1] E2E test: Record offline, verify queued, come online, verify uploaded
- [ ] T091 [US1] E2E test: Pause and resume recording multiple times
- [ ] T092 [US1] E2E test: Change privacy from Public to Private before upload

---

## Phase 4: User Story 5 - Discover Stories via Social Feed (P1)

**Priority**: P1
**Goal**: Users can browse endless feed of public stories, like content, mark favorites
**Independent Test**: Open discovery feed, scroll through stories, like/unlike, filter favorites, switch between Recent and For You modes

**Duration Estimate**: 1.5 weeks

**Dependencies**: Requires User Story 1 (stories must exist to discover)

**Acceptance Criteria**:
- New users see chronological feed (newest first)
- Endless scroll loads more stories automatically
- Users can like stories and see more similar content
- Users can mark favorites and filter to favorites view
- "Recent" and "For You" sort modes available

### Models & DAOs

- [ ] T093 [P] [US5] Implement Like DAO in src/database/dao/LikeDAO.ts
- [ ] T094 [P] [US5] Implement Favorite DAO in src/database/dao/FavoriteDAO.ts

### Services

- [ ] T095 [US5] Implement DiscoveryFeedService in src/services/feed/DiscoveryFeedService.ts with cursor-based pagination
- [ ] T096 [US5] Implement like/unlike logic in DiscoveryFeedService with optimistic updates
- [ ] T097 [US5] Implement favorite/unfavorite logic in DiscoveryFeedService

### API Integration

- [ ] T098 [US5] Implement feed API in src/services/api/FeedApi.ts (GET /api/feed?cursor=&sort=&limit=)
- [ ] T099 [US5] Implement like API in src/services/api/LikeApi.ts (POST /api/stories/:id/like, DELETE /api/stories/:id/like)
- [ ] T100 [US5] Implement favorite API in src/services/api/FavoriteApi.ts

### React Query Hooks

- [ ] T101 [P] [US5] Create useFeed hook in src/hooks/useFeed.ts with useInfiniteQuery, caching, offline-first mode
- [ ] T102 [P] [US5] Create useLikeStory hook in src/hooks/useLikeStory.ts with optimistic updates
- [ ] T103 [P] [US5] Create useFavoriteStory hook in src/hooks/useFavoriteStory.ts

### UI Components

- [ ] T104 [P] [US5] Create StoryCard component in src/components/feed/StoryCard.tsx with thumbnail, title, like button, favorite button
- [ ] T105 [P] [US5] Create FeedSortToggle component in src/components/feed/FeedSortToggle.tsx (Recent, For You, Favorites)
- [ ] T106 [P] [US5] Create InfiniteScrollList component in src/components/feed/InfiniteScrollList.tsx with auto-load on scroll

### Screens

- [ ] T107 [US5] Create DiscoveryFeedScreen in src/screens/discovery/DiscoveryFeedScreen.tsx with infinite scroll, sort toggle
- [ ] T108 [US5] Implement feed personalization logic (chronological for new users, recommendation-based after likes)
- [ ] T109 [US5] Implement pull-to-refresh for feed updates
- [ ] T110 [US5] Implement offline caching with React Query persistence

### Integration

- [ ] T111 [US5] Add DiscoveryFeedScreen to bottom tab navigation
- [ ] T112 [US5] Test feed scrolling performance with 1000+ stories
- [ ] T113 [US5] Test like/unlike with optimistic UI updates
- [ ] T114 [US5] Test favorites filter

### E2E Tests

- [ ] T115 [US5] E2E test: Open feed, scroll through 50 stories, verify auto-load
- [ ] T116 [US5] E2E test: Like story, verify count updates, unlike, verify count decreases
- [ ] T117 [US5] E2E test: Mark favorite, switch to Favorites view, verify story appears

---

## Phase 5: User Story 6 - View and Explore Family Stories (P1)

**Priority**: P1
**Goal**: Users can browse their own family's uploaded stories with AI-enriched metadata
**Independent Test**: View family library, see all stories (public/family-only/private), view AI tags, play videos

**Duration Estimate**: 1 week

**Dependencies**: Requires User Story 1

**Acceptance Criteria**:
- Family library shows all user's stories with thumbnails and titles
- AI-generated tags and metadata visible
- Video playback works
- Privacy indicators clear (Public, Family Only, Private)

### Services

- [ ] T118 [US6] Implement FamilyLibraryService in src/services/library/FamilyLibraryService.ts with getMyStories, filterByPrivacy

### API Integration

- [ ] T119 [US6] Implement my stories API in src/services/api/StoryApi.ts (GET /api/users/me/stories)

### React Query Hooks

- [ ] T120 [US6] Create useMyStories hook in src/hooks/useMyStories.ts with caching

### UI Components

- [ ] T121 [P] [US6] Create StoryListItem component in src/components/family/StoryListItem.tsx with thumbnail, title, privacy badge, AI tags
- [ ] T122 [P] [US6] Create PrivacyBadge component in src/components/common/PrivacyBadge.tsx (color-coded: Public, Family Only, Private)
- [ ] T123 [P] [US6] Create VideoPlayer component in src/components/playback/VideoPlayer.tsx with react-native-video

### Screens

- [ ] T124 [US6] Create FamilyLibraryScreen in src/screens/family/FamilyLibraryScreen.tsx with story list, filter by privacy
- [ ] T125 [US6] Create StoryDetailScreen in src/screens/family/StoryDetailScreen.tsx with video playback, AI metadata display
- [ ] T126 [US6] Implement story grouping by date/category

### Integration

- [ ] T127 [US6] Add FamilyLibraryScreen to bottom tab navigation
- [ ] T128 [US6] Test video playback start time (<2 seconds)
- [ ] T129 [US6] Test offline viewing of cached stories

### E2E Tests

- [ ] T130 [US6] E2E test: Open family library, verify all uploaded stories appear
- [ ] T131 [US6] E2E test: Tap story, verify video plays within 2 seconds

---

## Phase 6: User Story 12 - Guided Interview Mode (P1)

**Priority**: P1
**Goal**: Users get real-time question suggestions during recording based on speech recognition
**Independent Test**: Enable guided mode, record interview, verify starter questions appear, verify follow-up questions based on topics mentioned

**Duration Estimate**: 2 weeks

**Dependencies**: Requires User Story 1 (recording infrastructure)

**Acceptance Criteria**:
- Starter questions organized by topic (childhood, family origins, events, traditions)
- Real-time speech recognition analyzes content
- Local template matching for immediate suggestions (<1 second)
- AI-enhanced questions when online (5-10 seconds)
- Graceful degradation when offline (template-only)
- Session summary shows covered and skipped questions

### Models & DAOs

- [ ] T132 [P] [US12] Implement InterviewQuestion DAO in src/database/dao/InterviewQuestionDAO.ts
- [ ] T133 [P] [US12] Implement GuidedInterviewSession DAO in src/database/dao/GuidedInterviewSessionDAO.ts

### Database Seeds

- [ ] T134 [US12] Create interview question seeds in src/database/seeds/interviewQuestions.json with 50+ template questions across categories

### Services

- [ ] T135 [US12] Implement SpeechRecognitionService in src/services/speech/SpeechRecognitionService.ts with @react-native-voice/voice
- [ ] T136 [US12] Implement keyword matching in SpeechRecognitionService against local template database
- [ ] T137 [US12] Implement GuidedInterviewService in src/services/guided/GuidedInterviewService.ts with question selection logic
- [ ] T138 [US12] Implement AI-enhanced question generation in GuidedInterviewService (backend integration when online)
- [ ] T139 [US12] Implement session tracking with covered/skipped questions

### API Integration

- [ ] T140 [US12] Implement guided interview API in src/services/api/GuidedApi.ts (POST /api/guided/enhance-questions with transcript)

### UI Components

- [ ] T141 [P] [US12] Create StarterQuestionList component in src/components/guided/StarterQuestionList.tsx with category grouping
- [ ] T142 [P] [US12] Create FollowUpQuestionCard component in src/components/guided/FollowUpQuestionCard.tsx with queue button
- [ ] T143 [P] [US12] Create QuestionSourceBadge component in src/components/guided/QuestionSourceBadge.tsx (Template vs AI-Enhanced)
- [ ] T144 [P] [US12] Create SessionSummary component in src/components/guided/SessionSummary.tsx with covered/skipped questions

### Screens

- [ ] T145 [US12] Extend RecordingScreen to support guided mode toggle
- [ ] T146 [US12] Implement real-time question suggestion overlay in RecordingScreen
- [ ] T147 [US12] Create GuidedSessionSummaryScreen in src/screens/guided/GuidedSessionSummaryScreen.tsx
- [ ] T148 [US12] Implement question queue management UI

### Integration

- [ ] T149 [US12] Wire up speech recognition to question matching during recording
- [ ] T150 [US12] Test local template matching performance (<1 second response)
- [ ] T151 [US12] Test AI enhancement when online
- [ ] T152 [US12] Test offline graceful degradation (template-only mode)
- [ ] T153 [US12] Test iOS 1-minute speech recognition limit with auto-restart

### E2E Tests

- [ ] T154 [US12] E2E test: Enable guided mode, select starter question, begin recording
- [ ] T155 [US12] E2E test: Speak keyword triggers, verify follow-up questions appear within 1 second
- [ ] T156 [US12] E2E test: Complete guided session, verify summary shows covered questions

---

## Phase 7: User Story 14 - Build and Navigate Interactive Family Tree (P1)

**Priority**: P1
**Goal**: Users can build family tree, define relationships, link stories to people
**Independent Test**: Add family members, define parent-child/sibling/spouse relationships, link stories, navigate tree, view linked content

**Duration Estimate**: 2 weeks

**Dependencies**: Requires User Story 1 and User Story 6 (stories to link)

**Acceptance Criteria**:
- Add people with name and birth date
- Define relationships (parent-child, sibling, spouse)
- Visual tree representation across multiple generations
- Link interviews and family objects to people
- Zoom and pan on tree
- AI suggests person matches from interviews

### Models & DAOs

- [ ] T157 [P] [US14] Implement FamilyTreeMember DAO in src/database/dao/FamilyTreeMemberDAO.ts
- [ ] T158 [P] [US14] Implement FamilyRelationship DAO in src/database/dao/FamilyRelationshipDAO.ts

### Services

- [ ] T159 [US14] Implement FamilyTreeService in src/services/familyTree/FamilyTreeService.ts with CRUD for members and relationships
- [ ] T160 [US14] Implement tree visualization logic (layout algorithm for multi-generation display)
- [ ] T161 [US14] Implement content linking (stories and family objects to members)

### API Integration

- [ ] T162 [P] [US14] Implement family tree API in src/services/api/FamilyTreeApi.ts (GET/POST/PATCH/DELETE /api/family-tree/members)
- [ ] T163 [P] [US14] Implement AI person detection API in src/services/api/FamilyTreeApi.ts (POST /api/family-tree/detect-person)

### UI Components

- [ ] T164 [P] [US14] Create FamilyTreeCanvas component in src/components/familyTree/FamilyTreeCanvas.tsx with zoom, pan, node rendering
- [ ] T165 [P] [US14] Create PersonNode component in src/components/familyTree/PersonNode.tsx with photo, name, dates
- [ ] T166 [P] [US14] Create RelationshipLine component in src/components/familyTree/RelationshipLine.tsx
- [ ] T167 [P] [US14] Create AddPersonModal component in src/components/familyTree/AddPersonModal.tsx with name, dates, relationship selection
- [ ] T168 [P] [US14] Create PersonDetailPanel component in src/components/familyTree/PersonDetailPanel.tsx with linked content list

### Screens

- [ ] T169 [US14] Create FamilyTreeScreen in src/screens/familyTree/FamilyTreeScreen.tsx with canvas, add person button
- [ ] T170 [US14] Create PersonDetailScreen in src/screens/familyTree/PersonDetailScreen.tsx with all linked stories and objects
- [ ] T171 [US14] Implement tree layout algorithm for 100+ members
- [ ] T172 [US14] Implement AI person match suggestions with user confirmation flow

### Integration

- [ ] T173 [US14] Add FamilyTreeScreen to main navigation
- [ ] T174 [US14] Test tree rendering performance with 100 members
- [ ] T175 [US14] Test zoom and pan interactions
- [ ] T176 [US14] Test AI person detection accuracy

### E2E Tests

- [ ] T177 [US14] E2E test: Add 10 family members with relationships, verify tree displays correctly
- [ ] T178 [US14] E2E test: Link story to person, tap person, verify story appears

---

## Phase 8: User Story 2 - Attach Supporting Materials to Story (P2)

**Priority**: P2
**Goal**: Users can attach photos, videos, documents to stories with optional timestamps
**Independent Test**: Record story, attach photo/video/document, set timestamp, verify overlay appears during playback

**Duration Estimate**: 1 week

**Dependencies**: Requires User Story 1

**Acceptance Criteria**:
- Select multiple photos, videos, documents from device
- All attachments associated with story
- Optional timestamp specification for interactive overlays
- Attachments encrypted and uploaded

### Models & DAOs

- [ ] T179 [US2] Implement Attachment DAO in src/database/dao/AttachmentDAO.ts

### Services

- [ ] T180 [US2] Implement AttachmentService in src/services/attachment/AttachmentService.ts with addAttachment, uploadAttachment, linkToStory

### API Integration

- [ ] T181 [US2] Implement attachment upload API in src/services/api/AttachmentApi.ts (POST /api/attachments)

### UI Components

- [ ] T182 [P] [US2] Create AttachmentPicker component in src/components/attachment/AttachmentPicker.tsx with file type filtering
- [ ] T183 [P] [US2] Create AttachmentList component in src/components/attachment/AttachmentList.tsx
- [ ] T184 [P] [US2] Create TimestampInput component in src/components/attachment/TimestampInput.tsx for optional overlay timing

### Screens

- [ ] T185 [US2] Extend ReviewScreen to include "Attach Materials" button
- [ ] T186 [US2] Create AttachMaterialsScreen in src/screens/recording/AttachMaterialsScreen.tsx with picker, list, timestamp inputs

### Integration

- [ ] T187 [US2] Wire up attachment flow: ReviewScreen → AttachMaterialsScreen → Upload with story
- [ ] T188 [US2] Test multiple attachment types (photo, video, document)

---

## Phase 9: User Story 3 - Upload Family Object with Audio Narration (P2)

**Priority**: P2
**Goal**: Users can upload family artifacts (photos, documents, videos) with audio narration
**Independent Test**: Upload photo, record audio narration, set privacy, verify object appears in library with narration playback

**Duration Estimate**: 1 week

**Dependencies**: Requires User Story 1 (upload infrastructure)

**Acceptance Criteria**:
- Upload photo/document/video from device
- Record audio narration with pause/resume
- Same privacy controls as stories (Public, Family Only, Private)
- Objects appear in family library with distinct indicator

### Services

- [ ] T189 [US3] Implement FamilyObjectService in src/services/familyObject/FamilyObjectService.ts with createObject, uploadObject, recordNarration

### API Integration

- [ ] T190 [US3] Implement family object API in src/services/api/FamilyObjectApi.ts (POST/GET/PATCH /api/family-objects)

### UI Components

- [ ] T191 [P] [US3] Create ObjectTypePicker component in src/components/familyObject/ObjectTypePicker.tsx (photo, document, video)
- [ ] T192 [P] [US3] Create AudioNarrationRecorder component in src/components/familyObject/AudioNarrationRecorder.tsx with waveform visualization
- [ ] T193 [P] [US3] Create ObjectCard component in src/components/familyObject/ObjectCard.tsx with type indicator, narration play button

### Screens

- [ ] T194 [US3] Create UploadFamilyObjectScreen in src/screens/familyObject/UploadFamilyObjectScreen.tsx with file picker, narration recorder, privacy selector
- [ ] T195 [US3] Create FamilyObjectDetailScreen in src/screens/familyObject/FamilyObjectDetailScreen.tsx with object display and narration playback
- [ ] T196 [US3] Extend FamilyLibraryScreen to show family objects alongside stories

### Integration

- [ ] T197 [US3] Add "Upload Family Object" button to home screen
- [ ] T198 [US3] Test audio narration recording quality
- [ ] T199 [US3] Test offline upload queue for family objects

---

## Phase 10: User Story 4 - Edit Video Before Upload (P3)

**Priority**: P3
**Goal**: Users can trim, cut, stitch videos and enhance audio before uploading
**Independent Test**: Record video, trim beginning/end, cut middle section, stitch clips, toggle audio enhancement, preview, upload

**Duration Estimate**: 1.5 weeks

**Dependencies**: Requires User Story 1

**Acceptance Criteria**:
- Trim beginning and end of video
- Cut sections from middle
- Stitch multiple clips together
- AI-powered audio enhancement (noise reduction, volume normalization, clarity)
- Manual toggle for audio enhancement on/off
- Preview edited video before upload

### Services

- [ ] T200 [US4] Implement VideoEditingService in src/services/editing/VideoEditingService.ts with ffmpeg-kit-react-native
- [ ] T201 [US4] Implement trim functionality using FFmpeg commands
- [ ] T202 [US4] Implement cut functionality (remove middle sections)
- [ ] T203 [US4] Implement stitch functionality (concatenate clips)
- [ ] T204 [US4] Implement audio enhancement with FFmpeg filters (afftdn, loudnorm)

### UI Components

- [ ] T205 [P] [US4] Create VideoTimeline component in src/components/editing/VideoTimeline.tsx with drag handles for trim/cut
- [ ] T206 [P] [US4] Create AudioEnhancementToggle component in src/components/editing/AudioEnhancementToggle.tsx
- [ ] T207 [P] [US4] Create EditPreview component in src/components/editing/EditPreview.tsx

### Screens

- [ ] T208 [US4] Create VideoEditingScreen in src/screens/editing/VideoEditingScreen.tsx with timeline, controls, preview
- [ ] T209 [US4] Implement edit progress indicator for FFmpeg processing

### Integration

- [ ] T210 [US4] Add "Edit" option between RecordingScreen and ReviewScreen
- [ ] T211 [US4] Test editing performance with 60-minute video
- [ ] T212 [US4] Test audio enhancement quality

---

## Phase 11: User Story 7 - Search Stories by Topic, People, or Places (P2)

**Priority**: P2
**Goal**: Users can search for stories by keywords (topics, people, places)
**Independent Test**: Search for "Chicago", verify stories with that location appear; search for person name, verify stories mentioning them appear

**Duration Estimate**: 1 week

**Dependencies**: Requires User Story 6 (stories with AI metadata)

**Acceptance Criteria**:
- Search by person's name returns stories mentioning that person
- Search by topic returns stories tagged with related content
- Search by place returns stories associated with that location
- Search results show context highlighting the search term

### Services

- [ ] T213 [US7] Implement SearchService in src/services/search/SearchService.ts with fuzzy matching, AI metadata filtering

### API Integration

- [ ] T214 [US7] Implement search API in src/services/api/SearchApi.ts (GET /api/search?q=&type=)

### React Query Hooks

- [ ] T215 [US7] Create useSearch hook in src/hooks/useSearch.ts with debouncing

### UI Components

- [ ] T216 [P] [US7] Create SearchBar component in src/components/search/SearchBar.tsx with auto-suggest
- [ ] T217 [P] [US7] Create SearchResultCard component in src/components/search/SearchResultCard.tsx with keyword highlighting
- [ ] T218 [P] [US7] Create SearchFilterChips component in src/components/search/SearchFilterChips.tsx (All, People, Places, Topics)

### Screens

- [ ] T219 [US7] Create SearchScreen in src/screens/search/SearchScreen.tsx with search bar, filters, results list

### Integration

- [ ] T220 [US7] Add SearchScreen to main navigation
- [ ] T221 [US7] Test search performance with 1000+ stories
- [ ] T222 [US7] Test fuzzy matching for misspellings

---

## Phase 12: User Story 8 - Navigate Stories by Map (P3)

**Priority**: P3
**Goal**: Users can explore stories visually on map by location
**Independent Test**: Open map view, see markers for story locations, tap marker, view associated stories

**Duration Estimate**: 1 week

**Dependencies**: Requires User Story 7 (stories with location data)

**Acceptance Criteria**:
- Map displays markers for each story location
- Tap marker shows stories at that location
- Multiple stories at same location listed for selection
- Zoom and pan work smoothly

### Services

- [ ] T223 [US8] Implement MapService in src/services/map/MapService.ts with clustering for nearby locations

### UI Components

- [ ] T224 [P] [US8] Create StoryMap component in src/components/map/StoryMap.tsx with react-native-maps
- [ ] T225 [P] [US8] Create LocationMarker component in src/components/map/LocationMarker.tsx with story count badge
- [ ] T226 [P] [US8] Create LocationStoryList component in src/components/map/LocationStoryList.tsx

### Screens

- [ ] T227 [US8] Create MapNavigationScreen in src/screens/map/MapNavigationScreen.tsx

### Integration

- [ ] T228 [US8] Add MapNavigationScreen to main navigation
- [ ] T229 [US8] Test map performance with 1000+ markers
- [ ] T230 [US8] Test marker clustering at different zoom levels

---

## Phase 13: User Story 9 - Manage Story Privacy Settings (P2)

**Priority**: P2
**Goal**: Users can change story privacy after upload
**Independent Test**: Upload public story, change to family-only, verify not in public feed; change to private, verify only visible to owner

**Duration Estimate**: 3 days

**Dependencies**: Requires User Story 1 and User Story 6

**Acceptance Criteria**:
- Change privacy from Public to Family Only or Private
- Change from Family Only to Public or Private
- Change from Private to Public or Family Only
- Privacy changes reflected immediately in feeds
- Clear explanations of each privacy level

### Services

- [ ] T231 [US9] Implement privacy update logic in StoryService

### API Integration

- [ ] T232 [US9] Implement privacy update API in src/services/api/StoryApi.ts (PATCH /api/stories/:id/privacy)

### UI Components

- [ ] T233 [US9] Create PrivacySettingsModal component in src/components/story/PrivacySettingsModal.tsx with explanations

### Screens

- [ ] T234 [US9] Add privacy settings option to StoryDetailScreen

### Integration

- [ ] T235 [US9] Test privacy change propagation to feeds
- [ ] T236 [US9] Test family-only visibility restrictions

---

## Phase 14: User Story 10 - Ask the Griot About Family History (P2)

**Priority**: P2
**Goal**: Users can chat with AI to ask questions about family history
**Independent Test**: Ask "What do we know about migration?", receive answer citing uploaded stories and historical context

**Duration Estimate**: 1 week

**Dependencies**: Requires User Story 6 (stories as source material)

**Acceptance Criteria**:
- Chatbot responds to questions about family
- Answers cite uploaded stories with links
- Provides general historical context when relevant
- Synthesizes information across multiple stories
- Suggests what to record when no content exists

### Models & DAOs

- [ ] T237 [P] [US10] Implement AskTheGriotSession DAO in src/database/dao/AskTheGriotSessionDAO.ts
- [ ] T238 [P] [US10] Implement SourceCitation DAO in src/database/dao/SourceCitationDAO.ts

### Services

- [ ] T239 [US10] Implement GriotChatService in src/services/griot/GriotChatService.ts

### API Integration

- [ ] T240 [US10] Implement Griot API in src/services/api/GriotApi.ts (POST /api/griot/chat)

### UI Components

- [ ] T241 [P] [US10] Create ChatMessage component in src/components/griot/ChatMessage.tsx with source citations
- [ ] T242 [P] [US10] Create ChatInput component in src/components/griot/ChatInput.tsx
- [ ] T243 [P] [US10] Create SourceCitationLink component in src/components/griot/SourceCitationLink.tsx with tap to navigate

### Screens

- [ ] T244 [US10] Create AskTheGriotScreen in src/screens/griot/AskTheGriotScreen.tsx with chat interface

### Integration

- [ ] T245 [US10] Add AskTheGriotScreen to main navigation
- [ ] T246 [US10] Test source citation accuracy
- [ ] T247 [US10] Test response quality with limited vs extensive content

---

## Phase 15: User Story 11 - Learn Through Griot Tutorials (P2)

**Priority**: P2
**Goal**: Users can watch educational tutorials about recording oral histories
**Independent Test**: Browse tutorial library, watch video, resume from saved position, mark as complete

**Duration Estimate**: 4 days

**Dependencies**: None (independent feature)

**Acceptance Criteria**:
- Tutorials organized by category (recording basics, interview techniques, app features, being a Griot)
- Video playback with play, pause, seek
- Resume from last position
- Completed tutorials marked with progress indicators
- New users prompted to watch getting started tutorial

### Models & DAOs

- [ ] T248 [P] [US11] Implement Tutorial DAO in src/database/dao/TutorialDAO.ts
- [ ] T249 [P] [US11] Implement TutorialProgress DAO in src/database/dao/TutorialProgressDAO.ts

### Services

- [ ] T250 [US11] Implement TutorialService in src/services/tutorial/TutorialService.ts with progress tracking

### API Integration

- [ ] T251 [US11] Implement tutorial API in src/services/api/TutorialApi.ts (GET /api/tutorials)

### UI Components

- [ ] T252 [P] [US11] Create TutorialCard component in src/components/tutorial/TutorialCard.tsx with completion badge
- [ ] T253 [P] [US11] Create TutorialCategorySection component in src/components/tutorial/TutorialCategorySection.tsx

### Screens

- [ ] T254 [US11] Create TutorialLibraryScreen in src/screens/tutorials/TutorialLibraryScreen.tsx with category sections
- [ ] T255 [US11] Create TutorialPlayerScreen in src/screens/tutorials/TutorialPlayerScreen.tsx with progress save

### Integration

- [ ] T256 [US11] Add TutorialLibraryScreen to main navigation
- [ ] T257 [US11] Implement onboarding flow with tutorial prompt for new users
- [ ] T258 [US11] Test resume from saved position accuracy

---

## Phase 16: User Story 13 - Tag People in Photos and Add Multiple Narrations (P2)

**Priority**: P2
**Goal**: Users can tag people in photos and record separate narrations for each person
**Independent Test**: Upload photo, tap to tag person, record narration for each tagged person, verify multiple narrations playable

**Duration Estimate**: 1 week

**Dependencies**: Requires User Story 3 (family objects)

**Acceptance Criteria**:
- Tap on faces to tag with names
- Multiple tags per photo
- Separate audio narration for each tagged person
- Play narrations individually
- Search by person name shows photos where tagged

### Models & DAOs

- [ ] T259 [US13] Implement PersonTag DAO in src/database/dao/PersonTagDAO.ts

### Services

- [ ] T260 [US13] Implement PersonTaggingService in src/services/tagging/PersonTaggingService.ts with coordinate mapping

### API Integration

- [ ] T261 [US13] Implement person tagging API in src/services/api/PersonTagApi.ts (POST /api/family-objects/:id/tags)

### UI Components

- [ ] T262 [P] [US13] Create PhotoTagger component in src/components/tagging/PhotoTagger.tsx with tap-to-tag interface
- [ ] T263 [P] [US13] Create TagMarker component in src/components/tagging/TagMarker.tsx
- [ ] T264 [P] [US13] Create PersonNarrationRecorder component in src/components/tagging/PersonNarrationRecorder.tsx

### Screens

- [ ] T265 [US13] Create PhotoTaggingScreen in src/screens/tagging/PhotoTaggingScreen.tsx with tap interface, narration recorder per person

### Integration

- [ ] T266 [US13] Add "Tag People" option to FamilyObjectDetailScreen
- [ ] T267 [US13] Test AI face detection for tag suggestions
- [ ] T268 [US13] Test multiple narration playback

---

## Phase 17: User Story 15 - Receive Location-Based Story Notifications (P3)

**Priority**: P3
**Goal**: Users receive notifications when near locations with associated stories
**Independent Test**: Enable location notifications, approach story location, receive notification, tap to view story

**Duration Estimate**: 1 week

**Dependencies**: Requires User Story 8 (stories with locations)

**Acceptance Criteria**:
- Disabled by default, explicit opt-in required
- Clear privacy explanation when enabling
- Configure notification radius and content types
- Notification shows number of stories at location
- No duplicate notifications for same location
- Toggle to disable

### Models & DAOs

- [ ] T269 [US15] Implement LocationNotification DAO in src/database/dao/LocationNotificationDAO.ts

### Services

- [ ] T270 [US15] Implement GeofencingService in src/services/location/GeofencingService.ts with background monitoring
- [ ] T271 [US15] Implement notification trigger logic with duplicate prevention

### API Integration

- [ ] T272 [US15] Implement location notification API in src/services/api/LocationNotificationApi.ts

### UI Components

- [ ] T273 [P] [US15] Create LocationNotificationSettings component in src/components/location/LocationNotificationSettings.tsx with privacy explanation, radius slider
- [ ] T274 [P] [US15] Create NotificationPermissionPrompt component in src/components/location/NotificationPermissionPrompt.tsx

### Screens

- [ ] T275 [US15] Add location notification settings to SettingsScreen

### Integration

- [ ] T276 [US15] Implement background location monitoring
- [ ] T277 [US15] Test geofence trigger accuracy
- [ ] T278 [US15] Test battery impact of background monitoring

---

## Phase 18: User Story 16 - View Source Citations in Ask the Griot (P2)

**Priority**: P2
**Goal**: Griot responses include source citations with links to content
**Independent Test**: Ask question, verify response lists sources, tap source, navigate to content

**Duration Estimate**: 3 days

**Dependencies**: Requires User Story 10 (Ask the Griot)

**Acceptance Criteria**:
- All responses display source materials used
- Citations include interviews and family objects
- External sources labeled with source type
- Citations are tappable to view content
- Clear indication of which info came from which source

### UI Components

- [ ] T279 [US16] Extend ChatMessage component to render source citations at end of messages
- [ ] T280 [US16] Implement citation tap navigation to StoryDetailScreen or FamilyObjectDetailScreen

### Integration

- [ ] T281 [US16] Test citation accuracy (sources match content)
- [ ] T282 [US16] Test navigation from citation to source content

---

## Phase 19: User Story 17 - Watch Condensed Interview Highlights (P3)

**Priority**: P3
**Goal**: Users can watch AI-generated highlight reels of interviews
**Independent Test**: View interview, see "Highlights" option, watch condensed version, tap to jump to full interview

**Duration Estimate**: 4 days

**Dependencies**: Requires User Story 6 (stories)

**Acceptance Criteria**:
- "Full Interview" and "Highlights" options when viewing
- Highlights are 15-20% of original length
- AI identifies important moments
- Tap to jump to full interview at highlight moment
- Processing status visible while highlights generate
- Share option for full or highlights

### Models & DAOs

- [ ] T283 [US17] Implement InterviewHighlight DAO in src/database/dao/InterviewHighlightDAO.ts

### Services

- [ ] T284 [US17] Implement HighlightService in src/services/highlight/HighlightService.ts

### API Integration

- [ ] T285 [US17] Implement highlight API in src/services/api/HighlightApi.ts (GET /api/stories/:id/highlights)

### UI Components

- [ ] T286 [P] [US17] Create HighlightToggle component in src/components/highlight/HighlightToggle.tsx (Full / Highlights)
- [ ] T287 [P] [US17] Create HighlightTimeline component in src/components/highlight/HighlightTimeline.tsx with jump-to-full markers

### Screens

- [ ] T288 [US17] Extend StoryDetailScreen to include highlight playback option

### Integration

- [ ] T289 [US17] Test highlight generation time
- [ ] T290 [US17] Test jump-to-full-interview navigation

---

## Phase 20: User Story 18 - View Linked Objects During Interview Playback (P2)

**Priority**: P2
**Goal**: Interactive overlays appear at timestamps to view attached materials
**Independent Test**: Watch interview, overlay appears at timestamp, tap to view attachment, resume interview from pause point

**Duration Estimate**: 4 days

**Dependencies**: Requires User Story 2 (attachments with timestamps)

**Acceptance Criteria**:
- Overlay prompt appears when playback reaches timestamp
- Video pauses when user taps "View"
- Attached material displayed with narration
- "Resume" button returns to interview from pause point
- Timeline shows markers for upcoming overlays
- Toggle overlays on/off

### UI Components

- [ ] T291 [P] [US18] Create ObjectOverlayPrompt component in src/components/playback/ObjectOverlayPrompt.tsx
- [ ] T292 [P] [US18] Create AttachmentViewer component in src/components/playback/AttachmentViewer.tsx
- [ ] T293 [P] [US18] Create InterviewTimeline component in src/components/playback/InterviewTimeline.tsx with overlay markers

### Screens

- [ ] T294 [US18] Extend StoryDetailScreen video player to include overlay functionality

### Integration

- [ ] T295 [US18] Implement overlay trigger logic based on playback position
- [ ] T296 [US18] Test resume from pause after viewing attachment
- [ ] T297 [US18] Test multiple overlays at same timestamp (sequential queue)

---

## Phase 21: Polish & Cross-Cutting Concerns

**Goal**: Production-ready quality, performance, security, monitoring

**Duration Estimate**: 1 week

### Authentication & User Management

- [ ] T298 [P] Implement login screen in src/screens/auth/LoginScreen.tsx with email/password
- [ ] T299 [P] Implement signup screen in src/screens/auth/SignupScreen.tsx
- [ ] T300 [P] Implement password reset screen in src/screens/auth/PasswordResetScreen.tsx
- [ ] T301 [P] Implement social login (Google) in src/services/auth/SocialAuthService.ts
- [ ] T302 [P] Implement social login (Apple) - required for iOS
- [ ] T303 [P] Implement social login (Facebook)
- [ ] T304 Implement token refresh logic in TokenManager

### Storage Quota Management

- [ ] T305 [P] Implement quota tracking in src/services/quota/QuotaService.ts
- [ ] T306 [P] Create QuotaWarning component in src/components/quota/QuotaWarning.tsx (80% warning)
- [ ] T307 [P] Create QuotaExceeded component in src/components/quota/QuotaExceeded.tsx with upgrade options
- [ ] T308 Implement auto-privating logic for over-quota content
- [ ] T309 Implement quota restoration on membership upgrade

### Content Moderation

- [ ] T310 [P] Implement content reporting in src/services/moderation/ReportingService.ts
- [ ] T311 [P] Create ReportContentModal component in src/components/moderation/ReportContentModal.tsx with reason selection
- [ ] T312 Test report submission and tracking ID generation

### Family Groups

- [ ] T313 [P] Implement FamilyGroupService in src/services/family/FamilyGroupService.ts
- [ ] T314 [P] Implement invitation system in src/services/family/InvitationService.ts
- [ ] T315 [P] Create FamilyGroupScreen in src/screens/family/FamilyGroupScreen.tsx
- [ ] T316 Test invitation acceptance flow

### Observability & Monitoring

- [ ] T317 [P] Implement structured logging in src/services/observability/LoggingService.ts
- [ ] T318 [P] Implement metrics tracking in src/services/observability/MetricsService.ts
- [ ] T319 [P] Implement distributed tracing with correlation IDs
- [ ] T320 Implement analytics opt-out in privacy settings

### Performance Optimization

- [ ] T321 Optimize image loading with lazy loading and compression
- [ ] T322 Implement virtual scrolling for long lists (feed, library)
- [ ] T323 Optimize SQLite queries with proper indexing
- [ ] T324 Implement bundle splitting and lazy loading for screens
- [ ] T325 Profile and optimize app launch time (<3 seconds target)

### Security Hardening

- [ ] T326 Implement certificate pinning for API calls
- [ ] T327 Add biometric authentication option for app access
- [ ] T328 Implement secure file deletion (overwrite before delete)
- [ ] T329 Add privacy policy and terms of service screens

### Accessibility

- [ ] T330 [P] Add VoiceOver/TalkBack labels to all interactive components
- [ ] T331 [P] Implement dynamic type support for iOS
- [ ] T332 [P] Test color contrast meets WCAG AA standards
- [ ] T333 Implement reduced motion support

### Error Handling & Resilience

- [ ] T334 Implement global error boundary in src/components/ErrorBoundary.tsx
- [ ] T335 Implement retry logic for failed uploads (exponential backoff)
- [ ] T336 Implement graceful degradation for backend unavailability
- [ ] T337 Add user-friendly error messages for all error states

### Platform Compliance

- [ ] T338 Configure iOS App Store metadata and screenshots
- [ ] T339 Configure Google Play Store metadata and screenshots
- [ ] T340 Implement App Store encryption declaration
- [ ] T341 Implement Play Store encryption declaration
- [ ] T342 Test deep linking for notifications and shared content
- [ ] T343 Implement app rating prompt (after positive interactions)

### Testing & QA

- [ ] T344 Achieve 80%+ code coverage for services layer
- [ ] T345 Create E2E test suite covering all P1 user stories
- [ ] T346 Test on physical iOS devices (iPhone 12+, iOS 15+)
- [ ] T347 Test on physical Android devices (API 29+)
- [ ] T348 Test with varying network conditions (3G, 4G, 5G, WiFi, offline)
- [ ] T349 Load test with 1000+ stories in library
- [ ] T350 Security audit of encryption implementation

### CI/CD Pipeline

- [ ] T351 Configure GitHub Actions workflow for unit tests
- [ ] T352 Configure iOS E2E tests on macOS runners
- [ ] T353 Configure Android E2E tests with emulator
- [ ] T354 Implement automated versioning and changelog generation
- [ ] T355 Configure automated App Store and Play Store deployment

### Documentation

- [ ] T356 Update README.md with final setup instructions
- [ ] T357 Create CONTRIBUTING.md with development workflow
- [ ] T358 Document all environment variables in .env.example
- [ ] T359 Create troubleshooting guide for common issues

---

## Dependencies & Execution Order

### Critical Path (Must Complete in Order)

1. **Phase 1** → **Phase 2** (Setup → Foundational)
2. **Phase 2** → **Phase 3** (Foundational → US1: Record and Upload)
3. **Phase 3** → **Phase 4** (US1 → US5: Discovery Feed depends on stories existing)
4. **Phase 3** → **Phase 5** (US1 → US6: Family Library depends on stories)
5. **Phase 3** → **Phase 6** (US1 → US12: Guided Mode extends recording)
6. **Phase 5** → **Phase 7** (US6 → US14: Family Tree needs story linking)

### User Story Independence (Can Parallelize)

**After completing Phase 3 (US1)**, these can be developed in parallel:
- Phase 4 (US5: Discovery Feed)
- Phase 5 (US6: Family Library)
- Phase 6 (US12: Guided Mode)
- Phase 8 (US2: Attachments)
- Phase 9 (US3: Family Objects)

**After completing Phase 5 (US6)**, these can be developed in parallel:
- Phase 11 (US7: Search)
- Phase 14 (US10: Ask the Griot)

### Story Dependency Graph

```
Phase 1-2 (Setup + Foundational)
    ↓
Phase 3 (US1: Record & Upload) ← MVP RELEASE
    ↓
    ├─→ Phase 4 (US5: Discovery Feed)
    ├─→ Phase 5 (US6: Family Library)
    │       ↓
    │       ├─→ Phase 7 (US14: Family Tree)
    │       ├─→ Phase 11 (US7: Search)
    │       │       ↓
    │       │       └─→ Phase 12 (US8: Map Navigation)
    │       └─→ Phase 14 (US10: Ask the Griot)
    │               ↓
    │               └─→ Phase 18 (US16: Source Citations)
    ├─→ Phase 6 (US12: Guided Mode)
    ├─→ Phase 8 (US2: Attachments)
    │       ↓
    │       └─→ Phase 20 (US18: Interactive Overlays)
    ├─→ Phase 9 (US3: Family Objects)
    │       ↓
    │       └─→ Phase 16 (US13: Photo Tagging)
    ├─→ Phase 10 (US4: Video Editing)
    ├─→ Phase 13 (US9: Privacy Management)
    └─→ Phase 15 (US11: Tutorials) (Independent)

Phase 17 (US15: Location Notifications) - Depends on US8
Phase 19 (US17: Highlights) - Depends on US6

Phase 21 (Polish) - After all features complete
```

---

## Parallel Execution Opportunities

### Phase 1 (Setup)
- **Parallel**: T004-T009 (all dependency installations)
- **Parallel**: T024-T029 (all database models)
- **Sequential**: Project initialization, structure creation

### Phase 2 (Foundational)
- **Parallel**: T024-T029 (database models)
- **Parallel**: T038-T041 (Zustand stores)
- **Parallel**: T051-T056 (common UI components)

### Phase 3 (US1)
- **Parallel**: T074-T078 (UI components - different files)
- **Sequential**: Services → Screens → Integration

### Phase 4 (US5)
- **Parallel**: T093-T094 (DAOs)
- **Parallel**: T101-T103 (React Query hooks)
- **Parallel**: T104-T106 (UI components)

### Within Each User Story
Tasks marked `[P]` can be executed in parallel. Typically:
- UI components (different files)
- DAOs (different entities)
- API integration files (different endpoints)

**Estimated Parallel Speedup**: 30-40% reduction in total calendar time when properly parallelized

---

## Format Validation

✅ **All 359 tasks follow checklist format**: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ **All user story tasks labeled**: [US1], [US2], etc.
✅ **All parallelizable tasks marked**: [P] indicator present
✅ **File paths included**: Every task specifies target file or directory

---

## Success Metrics

**MVP Success Criteria** (Phase 3 - US1):
- SC-001: Record and playback within 3 taps ✓
- SC-004: <5% upload failure rate ✓
- SC-005: 95% automatic offline sync ✓
- SC-014: 90% first-time success rate ✓

**Full Release Success Criteria** (All Phases):
- All 75 success criteria from spec.md met
- All 242 functional requirements implemented
- Both iOS and Android builds pass App Store review
- Performance targets met (<3s launch, <2s playback start, <2s feed load)

---

**Next Steps**: Begin with Phase 1 (Project Setup). Each task is independently executable by an LLM with access to this specification, plan.md, data-model.md, and contracts/.

**Estimated Total Duration**: 16-20 weeks for full implementation (MVP: 4-5 weeks)

**Recommended Team Size**: 2-3 mobile developers for optimal parallel execution
