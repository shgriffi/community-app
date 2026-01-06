# Implementation Plan: Griot and Grits Mobile App

**Branch**: `001-mobile-app` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mobile-app/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a cross-platform mobile application for iOS and Android that enables users to record, edit, upload, and share family oral history videos with AI-enriched metadata. The app supports offline recording, guided interviews, family tree management, social discovery features, and location-based story navigation. Technical approach uses React Native for cross-platform development, SQLite for local caching, chunked uploads for reliability, and integrates with a backend API for AI processing and content storage.

## Technical Context

**Language/Version**: JavaScript/TypeScript with React Native 0.73+, targeting iOS 15+ and Android 10+ (API level 29+)
**Primary Dependencies**:
- React Native 0.73+ (cross-platform framework)
- React Native Camera/Vision Camera (video/audio recording)
- React Native Video (playback)
- React Navigation (navigation)
- React Native SQLite Storage (local database)
- React Native NetInfo (connectivity detection)
- React Native Geolocation (location services)
- React Native Maps (map visualization)
- NEEDS CLARIFICATION: Video editing library for trim/stitch/enhance capabilities
- NEEDS CLARIFICATION: Real-time speech recognition library for guided interview mode
- NEEDS CLARIFICATION: Encryption library for at-rest data protection (AES-256 or equivalent)
- NEEDS CLARIFICATION: HTTP client library for chunked upload support with retry logic
- NEEDS CLARIFICATION: State management solution (Redux, Zustand, React Query, or Context API)

**Storage**:
- SQLite (local caching of stories, metadata, family tree, offline queue)
- Device file system (encrypted video/photo/audio files)
- SecureStore/Keychain (authentication tokens, encryption keys)

**Testing**:
- Jest (unit tests)
- React Native Testing Library (component tests)
- Detox or Appium (E2E tests on physical devices and simulators)
- NEEDS CLARIFICATION: Specific E2E testing framework choice

**Target Platform**: iOS 15+ (App Store) and Android 10+ API level 29+ (Google Play Store)

**Project Type**: Mobile (cross-platform iOS/Android with React Native)

**Performance Goals**:
- App launch time <3 seconds on mid-range devices
- Recording start latency <1 second after tap
- Video playback start <2 seconds (95th percentile)
- Discovery feed initial load <2 seconds (95th percentile)
- Smooth 60 FPS scrolling in feeds and family tree navigation
- Upload chunking to handle videos up to 60 minutes with <5% failure rate

**Constraints**:
- Offline-first architecture: recording and viewing must work without internet
- Privacy & security: all content encrypted in transit (TLS) and at rest (AES-256)
- Video recordings up to 60 minutes maximum duration
- Support for multiple quality levels (240p, 480p, 720p, 1080p)
- Graceful degradation when backend unavailable
- App Store and Google Play Store compliance requirements
- Battery efficiency for background location monitoring
- Storage quota management with tiered limits

**Scale/Scope**:
- Support for 10,000+ concurrent active users
- Family trees with 100+ members
- Discovery feed with endless scroll of thousands of stories
- Offline cache of 50+ stories for browsing
- ~40-50 screens/views across app
- Support for large file uploads (multi-GB videos)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Cross-Platform First ✅
- **Requirement**: App must work on both Android and iOS using React Native or Flutter
- **Status**: PASS - Using React Native 0.73+ for shared codebase
- **Compliance**: All features designed for both platforms, E2E testing on both required

### II. Recording Quality ✅
- **Requirement**: Video recordings must capture audio clearly for transcription, support pause/resume, handle interruptions gracefully
- **Status**: PASS - FR-001 to FR-005 specify video/audio recording with pause/resume and interruption handling
- **Compliance**: Using React Native Camera/Vision Camera with platform-specific audio configuration for transcription quality

### III. Offline-First Architecture ✅
- **Requirement**: Users must record without internet, store locally until upload possible, clear sync status
- **Status**: PASS - FR-004, FR-044, FR-211 to FR-222 specify offline recording, local storage, sync queue, status indicators
- **Compliance**: SQLite for local caching, encrypted file system storage, NetInfo for connectivity detection, clear sync status UI

### IV. Privacy & Security (NON-NEGOTIABLE) ✅
- **Requirement**: All user content encrypted in transit and at rest, explicit consent before recording, App Store/Play Store privacy compliance
- **Status**: PASS - FR-042, FR-043, FR-241, FR-242 specify encryption requirements and consent
- **Compliance**: TLS for transit, AES-256 for at-rest, platform permission systems, privacy policy integration
- **Note**: Encryption library choice NEEDS CLARIFICATION in research phase

### V. Simplicity ✅
- **Requirement**: Recording starts within 3 taps, intuitive for non-technical users, minimize required input
- **Status**: PASS - SC-001 specifies 3 taps from launch to playback, SC-014 specifies 90% first-time success rate
- **Compliance**: Streamlined UX flows, minimal required fields, guided interview mode for assistance

### Platform Requirements ✅
- **App Store Compliance**: FR-238 to FR-242 specify platform requirements, permissions, privacy compliance
- **Status**: PASS - All required permissions handled (camera, microphone, storage, location, notifications)

### Technical Stack ✅
- **Framework**: React Native (as specified in constitution)
- **Video/Audio**: React Native Camera/Vision Camera (native modules)
- **Backend API**: RESTful (NEEDS CLARIFICATION: REST vs GraphQL in research phase)
- **Local Storage**: SQLite with encryption
- **Authentication**: Token-based (OAuth 2.0 with email/password and social login)

### Quality Gates ⚠️ DEFERRED
- **Build Success**: Both iOS and Android builds must compile - DEFERRED until implementation
- **Device Testing**: Recording tested on physical devices - DEFERRED until implementation
- **Network Testing**: Upload/download tested with varying conditions - DEFERRED until implementation
- **Permissions**: Properly requested on both platforms - DEFERRED until implementation

**OVERALL STATUS**: ✅ **PASS** - All constitutional requirements are addressed in design. Implementation quality gates will be verified during development.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# React Native Cross-Platform Mobile App Structure

mobile/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── recording/          # Video/audio recording components
│   │   ├── playback/           # Video playback components
│   │   ├── feed/               # Discovery feed components
│   │   ├── familyTree/         # Family tree visualization
│   │   ├── maps/               # Map and location components
│   │   ├── common/             # Shared components (buttons, inputs, etc.)
│   │   └── guided/             # Guided interview mode components
│   ├── screens/                # Screen/view components
│   │   ├── auth/               # Login, signup, password reset
│   │   ├── recording/          # Recording flow screens
│   │   ├── editing/            # Video editing screens
│   │   ├── discovery/          # Discovery feed screen
│   │   ├── family/             # Family library screens
│   │   ├── profile/            # User profile and settings
│   │   ├── griot/              # Ask the Griot chatbot
│   │   ├── tutorials/          # Tutorial library
│   │   └── familyTree/         # Family tree screens
│   ├── services/               # Business logic and API integration
│   │   ├── api/                # Backend API client
│   │   ├── auth/               # Authentication service
│   │   ├── recording/          # Recording management
│   │   ├── upload/             # Chunked upload with retry
│   │   ├── encryption/         # Encryption utilities
│   │   ├── sync/               # Offline sync queue
│   │   ├── location/           # Location services
│   │   └── speech/             # Speech recognition for guided mode
│   ├── store/                  # State management
│   │   ├── slices/             # Redux slices or state modules
│   │   ├── hooks/              # Custom React hooks
│   │   └── selectors/          # State selectors
│   ├── database/               # Local SQLite database
│   │   ├── schema/             # Database schema definitions
│   │   ├── migrations/         # Schema migrations
│   │   ├── models/             # Data models
│   │   └── dao/                # Data access objects
│   ├── navigation/             # React Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── utils/                  # Utility functions
│   │   ├── permissions/        # Permission handling
│   │   ├── validation/         # Input validation
│   │   ├── formatting/         # Data formatting
│   │   └── constants/          # App constants
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   └── assets/                 # Static assets (images, fonts)
├── ios/                        # iOS-specific native code
│   ├── GriotGrits/             # iOS app project
│   ├── Podfile                 # CocoaPods dependencies
│   └── [native modules]        # Platform-specific implementations
├── android/                    # Android-specific native code
│   ├── app/                    # Android app module
│   ├── build.gradle            # Gradle build configuration
│   └── [native modules]        # Platform-specific implementations
├── __tests__/                  # Test files
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests (Detox/Appium)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── metro.config.js             # Metro bundler configuration
├── jest.config.js              # Jest test configuration
├── .env.example                # Environment variables template
└── README.md                   # Project setup and documentation

# Backend API (separate repository or monorepo package - OUT OF SCOPE for this spec)
# The mobile app integrates with existing Griot and Grits backend services
```

**Structure Decision**: Using React Native cross-platform architecture with shared JavaScript/TypeScript codebase in `mobile/src/` and platform-specific native code in `ios/` and `android/` directories. This structure follows React Native best practices with feature-based organization (components, screens, services) and supports offline-first architecture through local database and sync services. The backend API is assumed to be a separate service/repository and is out of scope for this mobile app specification.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ **NO VIOLATIONS** - All constitutional requirements are met without exceptions.

---

## Post-Design Constitution Re-Evaluation

*Completed after Phase 1 design (data-model.md, contracts/, quickstart.md)*

### I. Cross-Platform First ✅ **CONFIRMED**
- **Design Decision**: Single React Native codebase in `mobile/src/`
- **Platform-specific code**: Isolated to `ios/` and `android/` directories
- **Compliance**: Data model, API contracts, and architecture support both platforms equally

### II. Recording Quality ✅ **CONFIRMED**
- **Design Decision**: react-native-vision-camera with platform-optimized audio configuration
- **Pause/Resume**: Implemented in VideoRecordingService with state management
- **Interruption Handling**: AppState monitoring switches to background mode gracefully
- **Compliance**: Architecture supports FR-001 to FR-008 recording requirements

### III. Offline-First Architecture ✅ **CONFIRMED**
- **Design Decision**: Local SQLite database with SyncQueue table for offline operations
- **Sync Manager**: Processes queue when connectivity restored via NetInfo
- **Status Indicators**: UI state reflects sync_status field from database
- **Compliance**: Data model includes sync_status, etag, and cached_at fields throughout

### IV. Privacy & Security (NON-NEGOTIABLE) ✅ **CONFIRMED**
- **Encryption at Rest**: react-native-keychain + quick-crypto + op-sqlite (AES-256-GCM)
- **Encryption in Transit**: HTTPS/TLS enforced (API contracts specify HTTPS-only)
- **Key Management**: Hardware-backed via iOS Keychain and Android Keystore
- **Explicit Consent**: Permission system requests camera/microphone before recording
- **App Store Compliance**: Privacy policy integration, encryption declarations planned
- **Compliance**: EncryptionService architecture implements constitutional requirements

### V. Simplicity ✅ **CONFIRMED**
- **3 Taps to Record**: Home → Record Button → Start Recording (meets SC-001)
- **Intuitive UX**: Guided interview mode reduces complexity for non-technical users
- **Minimal Input**: Default privacy (public), auto-quality detection, optional metadata
- **Compliance**: Navigation structure and screen flow designed for simplicity

### Platform Requirements ✅ **CONFIRMED**
- **Permissions**: Handled in services layer with platform-specific implementations
- **Privacy Policy**: API contracts include policy endpoints
- **Design Guidelines**: Component library follows HIG (iOS) and Material Design (Android)
- **Compliance**: Architecture separates platform-specific concerns in ios/ and android/

### Technical Stack ✅ **CONFIRMED**
- **Framework**: React Native 0.73+ (meets constitution requirement)
- **Video/Audio**: react-native-vision-camera (native modules)
- **Backend API**: RESTful (decision documented in research.md)
- **Local Storage**: @op-engineering/op-sqlite with SQLCipher encryption
- **Authentication**: JWT token-based with social login support
- **Compliance**: All technology choices align with constitution and are production-ready

### Quality Gates ⚠️ **DEFERRED TO IMPLEMENTATION**
- Build success, device testing, network testing, permissions remain deferred
- Will be validated during implementation phase with CI/CD pipelines

---

## Phase 1 Deliverables Completed

✅ **research.md**: All technical unknowns resolved with detailed analysis
✅ **data-model.md**: 25+ entities defined with relationships and indexes
✅ **contracts/**: API overview and story endpoints (additional contracts can be added as needed)
✅ **quickstart.md**: Development guide with architecture overview and code examples
✅ **Agent context**: CLAUDE.md updated with React Native technology stack

---

## Ready for Phase 2

All constitutional requirements confirmed. Design artifacts complete.

**Next Command**: `/speckit.tasks` to generate implementation tasks based on this plan.

**Branch Status**: `001-mobile-app` ready for task generation and implementation.
