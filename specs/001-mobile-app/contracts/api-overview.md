# API Contracts Overview

**Branch**: `001-mobile-app` | **Date**: 2026-01-06

This directory contains API contract definitions for the Griot and Grits mobile app backend integration.

## API Architecture

**Type**: RESTful API with strategic enhancements
**Base URL**: `https://api.griotandgrits.org/v1`
**Authentication**: Bearer token (JWT)
**Content Type**: `application/json` (except file uploads: `multipart/form-data`)

## Contract Files

- [auth.yaml](./auth.yaml) - Authentication endpoints (login, register, social auth)
- [stories.yaml](./stories.yaml) - Story CRUD operations and feed
- [family-objects.yaml](./family-objects.yaml) - Family object management
- [uploads.yaml](./uploads.yaml) - Chunked file upload (TUS protocol)
- [family-tree.yaml](./family-tree.yaml) - Family tree and relationships
- [sync.yaml](./sync.yaml) - Incremental sync operations
- [griot.yaml](./griot.yaml) - Ask the Griot chatbot
- [realtime.yaml](./realtime.yaml) - Server-Sent Events for real-time updates

## Common Patterns

### Authentication
All authenticated requests include:
```
Authorization: Bearer <jwt_token>
```

### Error Response Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Pagination (Cursor-based)
```
GET /api/resource?cursor=<opaque_cursor>&limit=20
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "opaque_string",
    "has_more": true
  }
}
```

### Field Selection (Sparse Fieldsets)
```
GET /api/stories/123?fields=id,title,thumbnail_url
```

### Incremental Sync
```
GET /api/sync?since=2024-01-05T10:00:00Z&entities=stories,family_tree
```

### ETags for Conflict Detection
Request:
```
If-Match: "etag_value"
PATCH /api/stories/123
```

Response on conflict:
```
HTTP 409 Conflict
{
  "error": {
    "code": "CONFLICT",
    "current_version": {...}
  }
}
```

### File Uploads (TUS Protocol)
See [uploads.yaml](./uploads.yaml) for detailed chunked upload specification.

## Rate Limiting

- **Free tier**: 100 requests/minute
- **Paid tier**: 500 requests/minute
- **Upload bandwidth**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704470400
```

## Versioning

API version in URL path: `/v1/`

Breaking changes will increment version number. Mobile app should gracefully handle:
- Unknown fields (ignore)
- Missing optional fields (use defaults)
- Deprecated fields (maintain backward compatibility for 6 months)

## Security

- **HTTPS only**: All endpoints require TLS
- **Authentication**: JWT tokens expire after 24 hours
- **Refresh tokens**: 30-day expiration, rotate on use
- **CORS**: Restricted to mobile app origins
- **Rate limiting**: Per user and per IP

## Monitoring

Mobile app should include headers for observability:
```
X-App-Version: 1.2.3
X-Platform: ios | android
X-Request-ID: <uuid>
X-Correlation-ID: <uuid>
```

Backend will return:
```
X-Response-Time: 123ms
X-Trace-ID: <distributed_trace_id>
```
