# Research: Griot and Grits Mobile App Technical Decisions

**Branch**: `001-mobile-app` | **Date**: 2026-01-06

This document consolidates research findings for all technical unknowns identified in [plan.md](./plan.md) during Phase 0.

---

## 1. Video Editing Library

**Decision**: `ffmpeg-kit-react-native` (min-gpl variant)

**Rationale**:
- Only library that meets ALL requirements: trim, cut middle sections, stitch, and audio enhancement
- Full support for noise reduction (`afftdn`), volume normalization (`loudnorm`), and clarity improvement
- Cross-platform with native binaries for both iOS and Android
- Production-ready with active maintenance
- Handles 60-minute videos (with appropriate UX considerations)

**Alternatives Considered**:
- **react-native-video-processing**: ❌ Abandoned (4+ years), no audio enhancement
- **react-native-compressor**: ⚠️ Limited (no stitching, no audio enhancement)
- **Native development**: ❌ Duplicate implementation, high maintenance burden

**Implementation Approach**:
- Install `ffmpeg-kit-react-native` with min-gpl package (~35MB)
- Create abstraction service layer (`src/services/videoEditing/`)
- Implement streaming encryption for large files (64KB chunks)
- Show progress UI during processing
- Limit mobile editing to <15 minutes for UX (suggest desktop for longer videos)

**Package**:
```json
{
  "ffmpeg-kit-react-native": "^5.1.0"
}
```

---

## 2. Real-Time Speech Recognition

**Decision**: `@react-native-voice/voice` with hybrid question generation

**Rationale**:
- Uses native platform APIs (Apple Speech Framework for iOS, Android SpeechRecognizer)
- Completely free with no API costs
- On-device processing for privacy
- Works offline by default
- Real-time partial results for keyword detection

**Architecture**: Three-tier hybrid approach
1. **Tier 1 (Required)**: Local template matching for instant suggestions (<1 second)
2. **Tier 2 (Optional)**: Backend AI enhancement when online (5-10 seconds)
3. **Tier 3 (Premium)**: Optional Whisper.cpp for maximum accuracy

**Alternatives Considered**:
- **Google Cloud Speech-to-Text**: ❌ Privacy concerns, no offline, $480-720/month cost
- **AWS Transcribe**: ❌ Cloud-based, no offline, similar cost
- **Whisper.cpp**: ⚠️ Large model size (150MB+), better as premium option
- **AssemblyAI**: ❌ Cloud-only, $450/month

**Implementation Approach**:
- Install `@react-native-voice/voice`
- Implement local template database (JSON with keyword → questions mapping)
- Real-time keyword matching (<10ms)
- Send transcripts to backend for AI-enhanced questions when online
- Handle iOS 1-minute limit with auto-restart and stitching

**Platform Considerations**:
- **iOS**: Excellent accuracy, 1-minute time limit per request, automatic punctuation
- **Android**: Varies by device, offline mode with language pack, no time limits

**Package**:
```json
{
  "@react-native-voice/voice": "^3.2.4"
}
```

**Cost**: $0/month (vs $450-720/month for cloud alternatives)

---

## 3. Encryption Library

**Decision**: Multi-library approach leveraging native OS capabilities
- **react-native-keychain** (key management with native OS integration)
- **react-native-quick-crypto** (file encryption using native crypto APIs)
- **@op-engineering/op-sqlite** (encrypted database with SQLCipher)

**Rationale**:
- **Native OS Integration**: Leverages platform-native encryption capabilities
  - **iOS**: Uses Apple's Security Framework and CommonCrypto
  - **Android**: Uses Android Keystore System and OpenSSL/BoringSSL
- Hardware-backed key storage automatically when available
- Native performance for large file encryption (60-minute videos)
- AES-256-GCM support with proper authentication
- SQLCipher integration for encrypted SQLite database

**Native OS Compatibility**:

**iOS (iOS 15+)**:
- **Keychain Services**: Stores keys in iOS Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
- **Secure Enclave**: Automatic hardware-backed encryption on devices with Secure Enclave (iPhone 5S+)
- **CommonCrypto**: Native AES-256-GCM implementation via `react-native-quick-crypto`
- **Data Protection API**: File-level encryption using `NSFileProtectionComplete`
- **Compliance**: App Store encryption declaration required, export compliance documentation

**Android (API 29+)**:
- **Keystore System**: Stores keys in Android Keystore with hardware backing when available
- **StrongBox**: Leverages hardware security module on Android 9+ devices with StrongBox support
- **OpenSSL/BoringSSL**: Native AES-256-GCM implementation
- **Scoped Storage**: Encrypted files stored in app-specific directory (`/data/data/com.griotgrits.app/`)
- **Compliance**: Play Store encryption declaration required

**Key Management Strategy**:
```
Master Encryption Key (MEK)
 └─> Stored in iOS Keychain / Android Keystore (hardware-backed when available)
     ├─> iOS: kSecAttrAccessible = WhenUnlockedThisDeviceOnly
     ├─> iOS: kSecAttrAccessGroup for app extensions (optional)
     ├─> Android: setUserAuthenticationRequired(false) for background access
     ├─> Android: setRandomizedEncryptionRequired(true) for enhanced security
     └─> Encrypts Data Encryption Keys (DEKs)
         ├─> File Encryption Key (AES-256-GCM via platform crypto)
         ├─> Database Encryption Key (SQLCipher AES-256-CBC)
         └─> Attachment Encryption Key (AES-256-GCM)
```

**Platform-Specific Implementation**:

**iOS**:
```typescript
// Uses iOS Keychain with Secure Enclave when available
await Keychain.setGenericPassword('master_key', key, {
  service: 'griot.master',
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE, // Secure Enclave
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY // Optional biometric
});

// File encryption uses CommonCrypto under the hood
const cipher = createCipheriv('aes-256-gcm', key, iv); // Maps to CCCrypt
```

**Android**:
```typescript
// Uses Android Keystore with StrongBox when available
await Keychain.setGenericPassword('master_key', key, {
  service: 'griot.master',
  securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE, // StrongBox/TEE
  storage: Keychain.STORAGE_TYPE.AES // AES encryption for stored credentials
});

// File encryption uses BoringSSL/OpenSSL
const cipher = createCipheriv('aes-256-gcm', key, iv); // Native crypto
```

**Alternatives Considered**:
- **react-native-mmkv**: ❌ Not designed for large files
- **crypto-js**: ❌ JavaScript-based (poor performance), no hardware backing, no native OS integration
- **WatermelonDB with SQLCipher**: ⚠️ Framework overhead when only encryption needed
- **Expo SecureStore**: ❌ Limited to Expo managed workflow, less control over native integration

**Performance**:
- 60-minute high-quality video (2.5GB): ~30-45 seconds encryption time (native AES-NI acceleration)
- 60-minute low-quality video (500MB): ~6-10 seconds
- **iOS**: Hardware acceleration via AES coprocessor on A-series chips
- **Android**: Hardware acceleration via ARMv8 Cryptography Extensions (when available)
- Battery impact: ~5-8% during encryption (hardware-accelerated reduces to ~3-4%)
- Storage overhead: 0% (AES-GCM streaming mode)

**Native OS Feature Detection**:
```typescript
// Detect hardware-backed encryption availability
const capabilities = await Keychain.getSupportedBiometryType();
const hasSecureHardware = await Keychain.getSecurityLevel() ===
  Keychain.SECURITY_LEVEL.SECURE_HARDWARE;

// iOS: Check for Secure Enclave
// Android: Check for StrongBox or TEE
if (hasSecureHardware) {
  console.log('Hardware-backed encryption available');
  // Use highest security settings
} else {
  console.log('Software-based encryption (fallback)');
  // Still secure, but no hardware backing
}
```

**Packages**:
```json
{
  "react-native-keychain": "^8.1.2",
  "react-native-quick-crypto": "^0.7.0",
  "@op-engineering/op-sqlite": "^6.0.0"
}
```

**Platform Requirements**:
- iOS 15+ supports all required Security Framework APIs
- Android API 29+ provides full Keystore System functionality
- Automatic graceful degradation to software encryption on older/unsupported devices

---

## 4. Chunked Upload Library

**Decision**: Hybrid approach
- **react-native-background-upload** (background uploads)
- **axios + custom chunking** (foreground uploads with full control)
- **React Native NetInfo** (connectivity awareness)

**Rationale**:
- Background upload support when app is minimized
- Full control over chunking strategy and retry logic
- Automatic network transition handling
- Pause/resume functionality
- Per-chunk progress tracking

**Chunking Strategy**:
- **Chunk size**: 5-10MB (5MB default, 10MB on WiFi)
- **Upload mode**: Sequential with optional 2-3 parallel chunks on WiFi
- **Adaptive sizing**: 2MB on 3G, 5MB on 4G, 10MB on 5G/WiFi
- **Network awareness**: Pause on loss, resume on reconnection, WiFi-only option

**Alternatives Considered**:
- **rn-fetch-blob**: ❌ Deprecated, limited background capabilities
- **Fetch API**: ❌ No background upload support
- **react-native-fs**: ❌ Basic upload only, no built-in retry/chunking

**Background Upload Limitations**:
- **iOS**: ~15-30 minutes background time (chunk to stay within limit)
- **Android**: More reliable with foreground service (persistent notification required)

**Implementation**:
- Foreground preferred when app active (axios + chunking)
- Background fallback when app minimized
- Offline queue saves state, resumes on app foreground
- Exponential backoff retry (1s, 3s, 5s, 10s, 30s)

**Packages**:
```json
{
  "react-native-background-upload": "^6.7.0",
  "axios": "^1.6.5",
  "axios-retry": "^4.0.0",
  "@react-native-community/netinfo": "^11.2.0",
  "react-native-fs": "^2.20.0"
}
```

---

## 5. State Management Solution

**Decision**: Zustand + React Query

**Rationale**:
- Perfect separation of concerns: Zustand for client state, React Query for server state
- Smallest bundle size (1KB Zustand + 12KB React Query)
- Excellent offline support via React Query's cache and Zustand's persistence
- Minimal boilerplate, maximum productivity
- Scales well to 40-50 screens with complex data flows
- No re-render issues (direct subscriptions, no context propagation)

**State Organization**:
- **Zustand stores**: auth, recording, uploadQueue, UI state, family tree
- **React Query**: All API operations, caching, optimistic updates, retry logic

**Alternatives Considered**:
- **Redux Toolkit + RTK Query**: ⚠️ More boilerplate, larger bundle (10KB+), overkill for some state
- **Jotai/Recoil + React Query**: ⚠️ Atom-based approach verbose for large state
- **Context API + React Query**: ❌ Re-render issues at scale, no good persistence patterns
- **MobX**: ⚠️ Larger learning curve, observable magic can be hard to debug

**Offline-First Architecture**:
```javascript
// Zustand for client state with persistence
const useUploadQueue = create(persist((set) => ({
  queue: [],
  addToQueue: (video) => set((state) => ({
    queue: [...state.queue, video]
  }))
}), { name: 'upload-queue', getStorage: () => AsyncStorage }))

// React Query for server state with caching
const useFeed = () => useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: fetchFeed,
  cacheTime: 1000 * 60 * 60 * 24, // 24 hours for offline
  networkMode: 'offlineFirst'
})
```

**Performance**:
- Smallest bundle impact (13KB total)
- Direct subscriptions prevent unnecessary re-renders
- React Query prevents redundant API calls
- Scales to 100+ family tree members efficiently

**Packages**:
```json
{
  "zustand": "^4.5.0",
  "@tanstack/react-query": "^5.17.0",
  "@tanstack/react-query-persist-client": "^5.17.0",
  "@tanstack/query-async-storage-persister": "^5.17.0",
  "@react-native-async-storage/async-storage": "^1.21.0"
}
```

---

## 6. E2E Testing Framework

**Decision**: Detox

**Rationale**:
- Gray-box testing with deep React Native integration
- Automatic synchronization with animations, network requests, and timers
- Eliminates flakiness from timing issues (critical for 60-minute video tests)
- Built specifically for React Native with first-class iOS and Android support
- Faster than Appium (no WebDriver overhead)
- Strong TypeScript/JavaScript integration

**Alternatives Considered**:
- **Appium**: ❌ Black-box approach, slower, unreliable waits, cannot detect pending network requests
- **Maestro**: ❌ Newer/less mature, declarative YAML syntax less flexible for complex scenarios
- **Cavy**: ❌ In-app testing only, cannot test permissions or background behavior

**Setup Complexity**: Medium (2-3 days initial setup)
- Configure iOS and Android build configurations
- Set up simulators/emulators
- Create Detox configuration file
- Establish CI/CD pipelines

**CI/CD Integration**:
- **iOS**: Requires macOS runners (GitHub Actions, CircleCI)
- **Android**: Can use Linux runners with Android emulators
- Parallel testing for both platforms
- Automatic video recording on test failure
- Estimated cost: $100-300/month for CI runners

**Testing Capabilities**:
- ✅ Video recording functionality (via UI interactions)
- ✅ File uploads and network operations (with automatic sync)
- ✅ Reliable selectors (test ID system)
- ✅ Offline/online transitions
- ✅ Background mode testing
- ⚠️ Limited WebView support (workaround with native components)
- ⚠️ Biometric auth requires test bypass flags

**Packages**:
```json
{
  "detox": "^20.14.0",
  "@testing-library/react-hooks": "^8.0.1",
  "@testing-library/react-native": "^12.4.3"
}
```

**Cost**: $0 (open source MIT license) + $100-300/month CI infrastructure

---

## 7. Backend API Approach

**Decision**: REST API with strategic enhancements

**Rationale**:
- Better alignment with offline-first architecture (simple URL-based caching, ETags)
- Native support for chunked file uploads (multipart/form-data, TUS protocol)
- Simpler mental model and implementation (resources map to entities)
- Standard HTTP caching leverages browser/OS cache
- Easier debugging (network tab shows full requests)
- Lower complexity and smaller bundle size

**Strategic Enhancements**:
- Field selection via query parameters: `?fields=title,video_url,attachments`
- Composite endpoints for common nested queries: `/api/stories/:id/full`
- Server-Sent Events (SSE) for real-time discovery feed updates
- Cursor-based pagination for infinite scroll
- ETags for conflict detection and bandwidth savings
- Incremental sync with timestamps: `/api/stories?since=2024-01-05T10:00:00Z`

**Alternatives Considered**:
- **GraphQL**: ❌ No native file upload support, caching complexity, offline challenges, larger bundle (Apollo Client 35KB+)
- GraphQL advantages (flexible querying, single request for nested data) can be achieved with REST field selection and composite endpoints
- Bandwidth savings are marginal (REST with field selection achieves similar efficiency)

**Implementation Approach**:
- React Query for API client with persistence
- TUS protocol for resumable chunked uploads
- SSE for real-time feed (fallback to polling)
- WatermelonDB for local SQLite storage
- Offline sync queue with retry logic

**Hybrid Option** (if needed later):
- Keep REST for file uploads
- Add GraphQL for complex nested queries (family tree)
- Use GraphQL subscriptions for real-time chat (Ask the Griot)
- **Recommendation**: Start pure REST, add GraphQL only if specific pain points emerge

**API Example Endpoints**:
```
POST   /api/auth/login
GET    /api/stories?since=&limit=&fields=
GET    /api/stories/:id/full   # Composite endpoint
POST   /api/files/             # TUS upload initiation
PATCH  /api/files/:id          # Chunk upload
GET    /api/feed?cursor=&limit=
GET    /api/feed/subscribe     # SSE for real-time
GET    /api/sync?since=&entities=
```

**Libraries**:
```json
{
  "@tanstack/react-query": "^5.17.0",
  "tus-js-client": "^3.1.0",
  "react-native-sse": "^1.2.1",
  "@nozbe/watermelondb": "^0.27.0"
}
```

**Cost Comparison**:
- REST with React Query: $0/month
- GraphQL with Apollo: $0/month (but higher development/maintenance cost)
- File uploads via REST: Native multipart (efficient)
- File uploads via GraphQL: Base64 encoding (33% larger) or separate REST endpoints (defeats purpose)

---

## 8. Backend API Mocking for Development and Testing

**Decision**: Multi-tier mocking strategy
- **MSW (Mock Service Worker)** for development and integration testing
- **JSON Server** for quick prototyping and demo environments
- **Detox Mocking** for E2E tests

**Rationale**:
- Development teams can work on mobile app independently from backend
- E2E tests run reliably without external dependencies
- Consistent mock data across environments
- Simulates realistic network conditions (latency, errors, offline)

**Implementation Approach**:

### Tier 1: MSW (Primary for Development and Integration Tests)

**MSW** (Mock Service Worker) intercepts network requests at the fetch/XHR level.

**Features**:
- ✅ Intercepts `fetch` and `axios` requests transparently
- ✅ Works in React Native (via Node.js setup)
- ✅ Simulates realistic response times, errors, network failures
- ✅ Supports chunked upload mocking (TUS protocol)
- ✅ Can be enabled/disabled per environment

**Setup**:
```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  // Authentication
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.delay(500), // Simulate network latency
      ctx.json({
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        token: 'mock_jwt_token_12345',
      })
    );
  }),

  // Stories list (discovery feed)
  rest.get('/api/stories', (req, res, ctx) => {
    const cursor = req.url.searchParams.get('cursor');
    const limit = parseInt(req.url.searchParams.get('limit') || '20');

    return res(
      ctx.delay(300),
      ctx.json({
        data: generateMockStories(limit),
        pagination: {
          next_cursor: cursor ? null : 'cursor_page_2',
          has_more: !cursor,
        },
      })
    );
  }),

  // Upload initiation (TUS)
  rest.post('/api/files/', (req, res, ctx) => {
    const uploadId = `upload_${Date.now()}`;
    return res(
      ctx.status(201),
      ctx.set('Location', `/api/files/${uploadId}`),
      ctx.set('Tus-Resumable', '1.0.0')
    );
  }),

  // Chunked upload (PATCH)
  rest.patch('/api/files/:uploadId', async (req, res, ctx) => {
    const uploadOffset = req.headers.get('Upload-Offset');
    const contentLength = req.headers.get('Content-Length');

    // Simulate chunk upload
    await new Promise(resolve => setTimeout(resolve, 100));

    return res(
      ctx.status(204),
      ctx.set('Upload-Offset', (parseInt(uploadOffset!) + parseInt(contentLength!)).toString())
    );
  }),

  // Simulate network errors (20% failure rate for testing retry logic)
  rest.post('/api/stories/:id/like', (req, res, ctx) => {
    if (Math.random() < 0.2) {
      return res(ctx.status(500), ctx.json({ error: { code: 'SERVER_ERROR' } }));
    }
    return res(ctx.status(201));
  }),
];

export const server = setupServer(...handlers);
```

**Enable in Development**:
```typescript
// src/services/api/apiClient.ts
if (__DEV__ && process.env.USE_MOCK_API === 'true') {
  const { server } = require('../../mocks/server');
  server.listen();
  console.log('🎭 Mock API enabled');
}
```

**Mock Data Generators**:
```typescript
// src/mocks/generators.ts
import { faker } from '@faker-js/faker';

export const generateMockStories = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    video_url: `https://mock-cdn.example.com/videos/${i}.mp4`,
    thumbnail_url: faker.image.urlPicsumPhotos({ width: 640, height: 360 }),
    duration_seconds: faker.number.int({ min: 60, max: 3600 }),
    quality: faker.helpers.arrayElement(['240p', '480p', '720p', '1080p']),
    privacy: faker.helpers.arrayElement(['public', 'family_only', 'private']),
    processing_status: 'completed',
    ai_metadata: {
      tags: faker.helpers.arrayElements(['family', 'history', 'migration', 'childhood'], 3),
      people: [faker.person.fullName(), faker.person.fullName()],
      places: [faker.location.city(), faker.location.state()],
    },
    like_count: faker.number.int({ min: 0, max: 100 }),
    is_favorited_by_user: faker.datatype.boolean(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    etag: `"${faker.string.alphanumeric(16)}"`,
  }));
};

export const generateMockFamilyTree = () => {
  const members = Array.from({ length: 15 }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    birth_date: faker.date.birthdate().toISOString(),
    death_date: faker.datatype.boolean() ? faker.date.past().toISOString() : null,
  }));

  const relationships = [];
  // Generate parent-child relationships
  for (let i = 1; i < members.length; i++) {
    relationships.push({
      person1_id: members[Math.floor(i / 2)].id,
      person2_id: members[i].id,
      relationship_type: 'parent-child',
      confidence: 'user_confirmed',
    });
  }

  return { members, relationships };
};
```

### Tier 2: JSON Server (Quick Prototyping)

**JSON Server** provides a full REST API from a JSON file.

**Setup**:
```bash
npm install --save-dev json-server
```

```json
// mock-db.json
{
  "users": [
    { "id": "1", "name": "Test User", "email": "test@example.com" }
  ],
  "stories": [
    {
      "id": "story_1",
      "user_id": "1",
      "title": "Grandmother's Story",
      "description": "A story about growing up in the South",
      "video_url": "https://mock-cdn.example.com/videos/1.mp4",
      "privacy": "public",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "family_tree_members": [],
  "tutorials": []
}
```

```json
// package.json
{
  "scripts": {
    "mock-server": "json-server --watch mock-db.json --port 3000 --delay 500"
  }
}
```

**Use in Development**:
```typescript
// .env.development
API_BASE_URL=http://localhost:3000
USE_MOCK_API=false  // Use JSON Server instead of MSW
```

### Tier 3: Detox Mocking (E2E Tests)

**Detox** mocking uses app-side configuration to return mock data.

**Setup**:
```typescript
// src/services/api/apiClient.ts
import { Platform } from 'react-native';

const isMockMode = __DEV__ && (
  // Detox sets this env variable
  process.env.DETOX_MOCK_MODE === 'true'
);

export const apiClient = axios.create({
  baseURL: isMockMode
    ? 'http://localhost:3000/mock'  // Points to Detox mock server
    : process.env.API_BASE_URL,
});

if (isMockMode) {
  // Use MSW handlers for Detox tests
  const { server } = require('../../mocks/server');
  server.listen();
}
```

**Detox Configuration**:
```javascript
// .detoxrc.js
module.exports = {
  // ...
  configurations: {
    'ios.sim.mock': {
      device: 'simulator',
      app: 'ios.debug',
      env: {
        DETOX_MOCK_MODE: 'true',
      },
    },
  },
};
```

### Network Condition Simulation

**Simulate offline/slow network**:
```typescript
// src/mocks/networkConditions.ts
import { server } from './server';
import { rest } from 'msw';

export const setNetworkCondition = (condition: 'offline' | 'slow' | 'normal') => {
  if (condition === 'offline') {
    server.use(
      rest.get('*', (req, res, ctx) => {
        return res.networkError('Network request failed');
      })
    );
  } else if (condition === 'slow') {
    server.use(
      rest.get('*', (req, res, ctx) => {
        return res(ctx.delay(3000)); // 3s delay
      })
    );
  } else {
    server.resetHandlers(); // Back to normal
  }
};

// Usage in tests
it('should queue upload when offline', async () => {
  setNetworkCondition('offline');
  await recordAndUploadVideo();
  expect(uploadQueue.length).toBe(1);

  setNetworkCondition('normal');
  await waitForSync();
  expect(uploadQueue.length).toBe(0);
});
```

### Mock Backend Server (Local Development)

**For full-stack local development**:
```typescript
// scripts/mock-backend/server.ts
import express from 'express';
import cors from 'cors';
import { handlers } from '../../src/mocks/handlers';

const app = express();
app.use(cors());
app.use(express.json());

// Convert MSW handlers to Express middleware
handlers.forEach(handler => {
  // MSW rest.get → Express app.get
  // MSW rest.post → Express app.post
  // Implementation details...
});

const PORT = process.env.MOCK_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🎭 Mock Griot and Grits backend running on http://localhost:${PORT}`);
});
```

```json
// package.json
{
  "scripts": {
    "dev:mock": "concurrently \"npm run mock-backend\" \"npm start\"",
    "mock-backend": "ts-node scripts/mock-backend/server.ts"
  }
}
```

**Alternatives Considered**:
- **Mirage JS**: ❌ Not compatible with React Native (browser-only)
- **Nock**: ❌ Node.js only, doesn't work in React Native runtime
- **Custom fetch wrapper**: ⚠️ Reinventing the wheel, MSW is better

**Packages**:
```json
{
  "devDependencies": {
    "msw": "^2.0.0",
    "@faker-js/faker": "^8.3.0",
    "json-server": "^0.17.4"
  }
}
```

**Testing Strategy with Mocks**:
1. **Unit tests**: Mock individual service calls with Jest mocks
2. **Integration tests**: Use MSW to mock entire API
3. **E2E tests**: Use MSW or JSON Server for consistent test data
4. **Manual testing**: Toggle between mock and real API via environment variable

**Benefits**:
- ✅ Develop mobile app independently from backend
- ✅ Reliable E2E tests (no flakiness from real API)
- ✅ Test edge cases (errors, slow network, offline)
- ✅ Demo app without backend infrastructure
- ✅ Onboard new developers faster (no backend setup required)

---

## 9. UI/UX Design & Styling

**Decision**: Extend Griot and Grits website design language to mobile app

**Rationale**:
- Maintains brand consistency across web and mobile platforms
- Leverages existing brand recognition and user familiarity
- Honors the cultural storytelling mission through visual design
- Creates cohesive user experience across all touchpoints

**Design System Analysis** (from https://griotandgrits.org):

**Color Palette**:
- **Primary Colors**: Deep auburn/terracotta tones (#a94728, #8b3a1f)
- **Accent Colors**: Warm red-browns for emphasis and calls-to-action
- **Neutral Base**: High-contrast neutrals for readability
- **Gradient Usage**: Warm gradients for buttons and highlights
- **Dark Mode**: Dark theme with warm accent preservation

**Typography**:
- **Font Family**: Sans-serif with clean, modern aesthetics
- **Text Rendering**: Antialiased for smooth readability on mobile
- **Hierarchy**: Clear typographic scale (headings, body, captions)
- **Tracking**: Tight letter-spacing for contemporary feel
- **Accessibility**: High contrast ratios meeting WCAG AA standards

**Component Styling**:
- **Buttons**:
  - Rounded corners with gradient backgrounds
  - Hover/press states with subtle scale and shadow transitions
  - Primary action: Warm gradient (matches "Donate Now" button)
  - Secondary action: Outlined or ghost style
- **Cards**: Clean, minimal design with subtle shadows
- **Input Fields**: Simple borders with focus states using primary color
- **Navigation**: Fixed top bar on mobile (collapsible)
- **Bottom Tab Bar**: iOS/Android native patterns with primary color accents

**Layout Patterns**:
- **Grid System**: Responsive with clear visual hierarchy
- **Spacing**: Generous padding for touch targets (minimum 44x44pt)
- **Content Sections**: Clear separation with whitespace
- **Image Treatment**: Photo collages and storytelling imagery
- **Scrolling**: Smooth, native feel with pull-to-refresh

**Brand Identity Elements**:
- **Visual Motifs**:
  - Photographic storytelling (overlapping images, collages)
  - Cultural authenticity in imagery
  - Historical photograph integration
- **Iconography**: Simple, recognizable icons
- **Transitions**: Soft, purposeful animations (avoid jarring)
- **Loading States**: Skeleton screens with brand colors

**Mobile-Specific Adaptations**:
- **Touch Targets**: Minimum 44pt (iOS) / 48dp (Android)
- **Gestures**: Swipe, pull-to-refresh, pinch-to-zoom (where appropriate)
- **Status Bar**: Light content on dark backgrounds, dark content on light
- **Safe Areas**: Respect iOS notch and Android navigation bars
- **Haptic Feedback**: Subtle haptics for key interactions

**Platform Guidelines Integration**:
- **iOS**: Follow Human Interface Guidelines (HIG)
  - Native navigation patterns
  - SF Symbols where appropriate
  - System fonts as fallback
- **Android**: Follow Material Design 3
  - Material You color adaptation
  - Ripple effects on touch
  - FAB for primary actions

**Implementation Approach**:

**React Native Styling Libraries**:
```json
{
  "react-native-ui-lib": "^7.0.0",
  "react-native-paper": "^5.11.0",
  "react-native-vector-icons": "^10.0.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0"
}
```

**Design Tokens** (src/styles/tokens.ts):
```typescript
export const Colors = {
  primary: {
    main: '#a94728',
    dark: '#8b3a1f',
    light: '#c15a3a',
  },
  neutral: {
    white: '#ffffff',
    black: '#000000',
    gray100: '#f5f5f5',
    gray200: '#e5e5e5',
    gray300: '#d4d4d4',
    gray700: '#404040',
    gray900: '#171717',
  },
  gradient: {
    primary: ['#a94728', '#8b3a1f'],
  },
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
```

**Themed Components** (src/components/common/):
```typescript
// Button.tsx
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, BorderRadius, Spacing } from '@/styles/tokens';

export const PrimaryButton = ({ onPress, children }) => (
  <TouchableOpacity onPress={onPress} style={styles.button}>
    <LinearGradient
      colors={Colors.gradient.primary}
      style={styles.gradient}
    >
      <Text style={styles.text}>{children}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  text: {
    color: Colors.neutral.white,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
});
```

**Dark Mode Support**:
```typescript
// src/hooks/useColorScheme.ts
import { useColorScheme as useRNColorScheme } from 'react-native';

export const useTheme = () => {
  const scheme = useRNColorScheme();

  return {
    isDark: scheme === 'dark',
    colors: scheme === 'dark' ? DarkColors : LightColors,
  };
};

const DarkColors = {
  background: '#0a0a0a',
  surface: '#171717',
  text: '#ffffff',
  textSecondary: '#a3a3a3',
  primary: '#c15a3a', // Slightly lighter for dark mode
};

const LightColors = {
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#171717',
  textSecondary: '#737373',
  primary: '#a94728',
};
```

**Accessibility Features**:
- **Dynamic Type**: Support iOS Dynamic Type and Android font scaling
- **Color Contrast**: All text meets WCAG AA (4.5:1 normal, 3:1 large)
- **Screen Readers**: VoiceOver (iOS) and TalkBack (Android) support
- **Reduced Motion**: Respect system preference for reduced motion
- **Focus Indicators**: Clear focus states for keyboard navigation

**Alternatives Considered**:
- **Styled Components**: ⚠️ Performance overhead in React Native, less common
- **Tailwind CSS (Nativewind)**: ⚠️ Newer ecosystem, less mature for RN
- **Custom Design System**: ❌ Time-intensive, reinventing solved problems
- **Material Design Only**: ❌ Doesn't match Griot and Grits brand identity
- **Pure iOS/Android Native**: ❌ Against cross-platform first principle

**Packages**:
```json
{
  "react-native-linear-gradient": "^2.8.3",
  "react-native-ui-lib": "^7.0.0",
  "react-native-vector-icons": "^10.0.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "react-native-paper": "^5.11.0"
}
```

**Design Quality Gates**:
- All components must use design tokens (no hard-coded colors/sizes)
- Touch targets minimum 44pt iOS / 48dp Android
- Color contrast meets WCAG AA
- Dark mode support for all screens
- Platform-specific adaptations where appropriate
- Smooth 60 FPS animations and transitions

---

## Summary of Decisions

| Area | Decision | Key Reason |
|------|----------|------------|
| Video Editing | ffmpeg-kit-react-native | Only solution meeting all requirements |
| Speech Recognition | @react-native-voice/voice | Free, offline, privacy-first with hybrid enhancement |
| Encryption | react-native-keychain + quick-crypto + op-sqlite | **Native OS integration** (iOS Security Framework, Android Keystore) |
| Chunked Upload | Hybrid (background-upload + axios) | Background support + full foreground control |
| State Management | Zustand + React Query | Perfect offline-first fit, minimal bundle, low complexity |
| E2E Testing | Detox | React Native optimization eliminates flakiness |
| Backend API | REST with enhancements | Offline-first alignment, native file upload support |
| Backend Mocking | MSW + JSON Server + Faker | Independent development, reliable testing, realistic network simulation |
| UI/UX Design | Griot and Grits brand extension with design tokens | Brand consistency, cultural authenticity, accessibility |

## Total Additional Bundle Size

**Estimated Impact**:
- ffmpeg-kit-react-native (min-gpl): ~35MB
- @react-native-voice/voice: <1MB
- Encryption libraries: ~2MB
- Zustand: 1KB
- React Query: 12KB
- Axios: 5KB
- Detox: Dev dependency (no runtime impact)

**Total**: ~37MB (primarily ffmpeg, which is necessary for FR-009 to FR-014 requirements)

**Mitigation**:
- Use App Thinning for platform-specific binaries
- On-demand resources for optional features (Whisper premium)
- Lazy loading where possible

---

## Next Phase

All "NEEDS CLARIFICATION" items from Technical Context have been resolved. Proceed to Phase 1: Design & Contracts.
