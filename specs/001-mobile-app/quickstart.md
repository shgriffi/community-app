# Quickstart Guide: Griot and Grits Mobile App

**Branch**: `001-mobile-app` | **Date**: 2026-01-06

This guide provides a quick overview of the mobile app architecture and how to get started with development.

---

## Architecture Overview

**Framework**: React Native 0.73+
**Platforms**: iOS 15+ and Android 10+ (API 29+)
**Language**: TypeScript
**State Management**: Zustand (client state) + React Query (server state)
**Local Database**: SQLite with @op-engineering/op-sqlite
**Backend API**: RESTful with TUS for file uploads

### Key Architectural Principles

1. **Offline-First**: App functions fully without internet connection
2. **Encryption by Default**: All content encrypted at rest (AES-256) and in transit (TLS)
3. **Optimistic UI**: Immediate feedback, background sync
4. **Chunked Uploads**: Large files (60-minute videos) uploaded in 5-10MB chunks with retry
5. **Cross-Platform**: Shared codebase with platform-specific optimizations

---

## Project Structure

```
mobile/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components (auth, recording, discovery, etc.)
│   ├── services/       # Business logic (API, encryption, upload, sync)
│   ├── store/          # Zustand stores (auth, recording, uploadQueue, UI)
│   ├── database/       # SQLite schema, models, DAOs
│   ├── navigation/     # React Navigation setup
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── ios/                # iOS-specific native code
├── android/            # Android-specific native code
└── __tests__/          # Test files
```

---

## Core Dependencies

```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "react-navigation": "^6.0.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.17.0",
    "@op-engineering/op-sqlite": "^6.0.0",
    "react-native-keychain": "^8.1.2",
    "react-native-quick-crypto": "^0.7.0",
    "react-native-background-upload": "^6.7.0",
    "axios": "^1.6.5",
    "ffmpeg-kit-react-native": "^5.1.0",
    "@react-native-voice/voice": "^3.2.4",
    "@react-native-community/netinfo": "^11.2.0",
    "react-native-vision-camera": "^3.0.0"
  },
  "devDependencies": {
    "detox": "^20.14.0",
    "@testing-library/react-native": "^12.4.3",
    "jest": "^29.0.0"
  }
}
```

---

## Key Features Implementation

### 1. Video Recording with Pause/Resume

**File**: `src/services/recording/VideoRecordingService.ts`

```typescript
import { Camera } from 'react-native-vision-camera';
import { useRecordingStore } from '@/store/recordingStore';

class VideoRecordingService {
  async startRecording(quality: '240p' | '480p' | '720p' | '1080p') {
    // Request permissions
    const permission = await Camera.requestCameraPermission();

    // Start recording with quality settings
    await camera.startRecording({
      quality,
      onRecordingFinished: this.handleRecordingComplete,
      onRecordingError: this.handleRecordingError
    });

    // Update store
    useRecordingStore.getState().startRecording();
  }

  async pauseRecording() {
    await camera.pauseRecording();
    useRecordingStore.getState().pauseRecording();
  }

  async resumeRecording() {
    await camera.resumeRecording();
    useRecordingStore.getState().resumeRecording();
  }
}
```

### 2. Offline-First with Sync Queue

**File**: `src/services/sync/SyncManager.ts`

```typescript
import { useUploadQueue } from '@/store/uploadQueueStore';
import NetInfo from '@react-native-community/netinfo';

class SyncManager {
  async init() {
    // Monitor network changes
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    const { getPendingUploads, updateStatus, removeFromQueue } =
      useUploadQueue.getState();

    const pending = getPendingUploads();

    for (const video of pending) {
      try {
        updateStatus(video.id, 'uploading');
        await this.uploadChunked(video);
        removeFromQueue(video.id);
      } catch (error) {
        updateStatus(video.id, 'failed');
      }
    }
  }
}
```

### 3. Chunked Upload with TUS

**File**: `src/services/upload/ChunkedUploadService.ts`

```typescript
import { Upload } from 'tus-js-client';
import { encryptFile } from '@/services/encryption/FileEncryption';

class ChunkedUploadService {
  async uploadVideo(localPath: string, storyId: string) {
    // Encrypt video file
    const encryptedPath = await encryptFile(localPath);

    // Upload with TUS protocol
    const upload = new Upload(encryptedPath, {
      endpoint: 'https://api.griotandgrits.org/files/',
      chunkSize: 5 * 1024 * 1024, // 5MB chunks
      retryDelays: [0, 1000, 3000, 5000],
      metadata: { storyId, filename: `${storyId}.mp4` },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        this.updateProgress(storyId, percentage);
      },
      onSuccess: () => {
        this.finalizeUpload(storyId, upload.url);
      }
    });

    upload.start();
    return upload; // For pause/resume control
  }
}
```

### 4. Encryption with Hardware-Backed Keys

**File**: `src/services/encryption/EncryptionService.ts`

```typescript
import * as Keychain from 'react-native-keychain';
import { createCipheriv, randomBytes } from 'react-native-quick-crypto';
import RNFS from 'react-native-fs';

class EncryptionService {
  async getMasterKey(): Promise<Buffer> {
    const credentials = await Keychain.getGenericPassword({
      service: 'griot.master'
    });

    if (!credentials) {
      // Generate new master key
      const key = randomBytes(32);
      await Keychain.setGenericPassword('master_key', key.toString('base64'), {
        service: 'griot.master',
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE
      });
      return key;
    }

    return Buffer.from(credentials.password, 'base64');
  }

  async encryptFile(inputPath: string, outputPath: string): Promise<void> {
    const key = await this.getMasterKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    // Write IV to beginning of file
    await RNFS.writeFile(outputPath, iv);

    // Stream encrypt in 64KB chunks
    const inputStream = RNFS.createReadStream(inputPath, { highWaterMark: 64 * 1024 });
    const outputStream = RNFS.createWriteStream(outputPath, { flags: 'a' });

    await pipeline(inputStream, cipher, outputStream);

    // Append auth tag
    const authTag = cipher.getAuthTag();
    await RNFS.appendFile(outputPath, authTag);
  }
}
```

### 5. State Management with Zustand + React Query

**File**: `src/store/authStore.ts`

```typescript
import create from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true
      }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      })
    }),
    {
      name: 'auth-storage',
      getStorage: () => AsyncStorage
    }
  )
);
```

**File**: `src/hooks/useFeed.ts`

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';

export const useFeed = () => {
  const sortMode = useUIStore(state => state.feedSortMode);

  return useInfiniteQuery({
    queryKey: ['feed', sortMode],
    queryFn: ({ pageParam = null }) =>
      fetch(`/api/stories?cursor=${pageParam}&sort=${sortMode}`)
        .then(r => r.json()),
    getNextPageParam: (lastPage) => lastPage.pagination.next_cursor,
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours for offline
    staleTime: 1000 * 60 * 5,
    networkMode: 'offlineFirst'
  });
};
```

---

## Development Workflow

### 1. Setup Development Environment

```bash
# Clone repository
git clone https://github.com/griotandgrits/community-app.git
cd community-app

# Checkout mobile app branch
git checkout 001-mobile-app

# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Android setup (ensure Android SDK installed)
```

### 2. Run on Simulator/Emulator

```bash
# iOS
npm run ios

# Android
npm run android
```

### 3. Run Tests

```bash
# Unit tests
npm test

# E2E tests (Detox)
npm run e2e:build:ios
npm run e2e:test:ios

npm run e2e:build:android
npm run e2e:test:android
```

### 4. Development Scripts

```bash
# Start Metro bundler
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for release
npm run build:ios
npm run build:android
```

---

## Testing Strategy

### Unit Tests (Jest + React Native Testing Library)
- **Location**: `__tests__/unit/`
- **Coverage**: Services, utilities, hooks
- **Command**: `npm test`

### Integration Tests
- **Location**: `__tests__/integration/`
- **Coverage**: Data flows, API integration, encryption
- **Command**: `npm run test:integration`

### E2E Tests (Detox)
- **Location**: `__tests__/e2e/`
- **Coverage**: User flows (record, upload, discovery, etc.)
- **Command**: `npm run e2e:test:ios` or `npm run e2e:test:android`

---

## CI/CD Pipeline

**.github/workflows/mobile.yml**

```yaml
name: Mobile App CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run typecheck

  e2e-ios:
    runs-on: macos-13
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: cd ios && pod install
      - run: npm run e2e:build:ios
      - run: npm run e2e:test:ios

  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run e2e:build:android
      - uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 30
          script: npm run e2e:test:android
```

---

## Security Considerations

1. **Never commit secrets**: Use `.env` files (gitignored)
2. **Encrypt all content**: Files and database encrypted at rest
3. **Use HTTPS only**: All API calls over TLS
4. **Hardware-backed keys**: iOS Keychain / Android Keystore
5. **Validate permissions**: Request only when needed
6. **Sanitize inputs**: Prevent injection attacks

---

## Performance Optimization

1. **Lazy loading**: Load components on demand
2. **Memoization**: Use `React.memo` and `useMemo` for expensive operations
3. **Image optimization**: Compress thumbnails, lazy load full images
4. **Database indexing**: Ensure proper indexes on frequently queried fields
5. **Chunked uploads**: 5-10MB chunks for large files
6. **Cache management**: React Query handles caching automatically

---

## Troubleshooting

### Common Issues

**iOS Build Fails**:
```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

**Android Build Fails**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Metro Bundler Issues**:
```bash
npm start -- --reset-cache
```

**Detox Tests Failing**:
```bash
# Rebuild app
npm run e2e:build:ios
# Run tests with verbose logging
npm run e2e:test:ios -- --loglevel verbose
```

---

## Next Steps

1. Review [data-model.md](./data-model.md) for entity relationships
2. Review [contracts/](./contracts/) for API specifications
3. Read [research.md](./research.md) for technical decisions
4. See [plan.md](./plan.md) for full implementation plan
5. Run `/speckit.tasks` to generate implementation tasks

---

## Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Detox Documentation](https://wix.github.io/Detox/)
- [TUS Protocol Specification](https://tus.io/)
- [Griot and Grits Organization](https://griotandgrits.org)

---

For questions or contributions, see the main project README or contact the development team.
