# Griot and Grits Mobile App Constitution

## Core Principles

### I. Cross-Platform First
App must work on both Android and iOS. Use React Native or Flutter for shared codebase. All features must be tested on both platforms before release.

### II. Recording Quality
Video recordings must capture audio clearly for transcription. Support pause/resume functionality. Handle interruptions gracefully (calls, notifications).

### III. Offline-First Architecture
Users must be able to record content without internet connection. Recordings stored locally until upload possible. Clear sync status indicators required.

### IV. Privacy & Security (NON-NEGOTIABLE)
All user content encrypted in transit and at rest. Explicit consent required before recording. Comply with Apple App Store and Google Play Store privacy requirements.

### V. Simplicity
Recording must start within 3 taps. Exploration interface must be intuitive for non-technical users. Minimize required user input.

## Platform Requirements

### App Store Compliance
- Handle all required permissions: microphone, camera, storage, photo library
- Provide privacy policy and terms of service
- Follow platform-specific design guidelines (HIG for iOS, Material Design for Android)

### Technical Stack
- Framework: React Native or Flutter
- Video/audio recording: Native modules
- Backend API: RESTful or GraphQL
- Local storage: Encrypted database (SQLite or equivalent)
- Authentication: Secure token-based auth

## Development Workflow

### Quality Gates
- Both platform builds must compile successfully
- Recording functionality tested on physical devices
- Upload/download tested with varying network conditions
- Privacy permissions properly requested on both platforms

### Code Review Requirements
- All PRs require at least one approval
- PRs must include tests for new functionality
- Breaking changes require documentation update
- Security-related changes require additional review

### Contribution Guidelines
- Fork and submit pull requests from feature branches
- Follow existing code style and conventions
- Include clear commit messages describing changes
- Update relevant documentation for feature changes
- Test on both iOS and Android before submitting

## Governance

Constitution supersedes all other development practices. Constitution amendments require documented justification and team approval. Backend API changes must maintain backward compatibility with mobile clients. All contributions must verify compliance with privacy and security principles.

**Version**: 1.0.0 | **Ratified**: 2026-01-05 | **Last Amended**: 2026-01-05

