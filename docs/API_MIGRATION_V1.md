# API Migration Guide - v1

**Date**: 2025-01-24  
**Version**: 1.0.0  
**Status**: ✅ ACTIVE

---

## Overview

This guide documents the migration from unversioned API endpoints to versioned `/api/v1` endpoints.

## Changes Summary

### 1. API Versioning Added

All endpoints now include `/api/v1` prefix for better version management and backward compatibility.

### 2. Structured Health Response

Health endpoint now returns a typed `HealthResponse` object instead of generic `Map<String, Object>`.

### 3. ProgressEvent Error Field

Added `error` field to `ProgressEvent` for better error reporting during document ingestion.

---

## Endpoint Changes

### Before (Unversioned)

| Old Endpoint | Method | Status |
|--------------|--------|--------|
| `/docs/search` | GET | ⚠️ DEPRECATED |
| `/ingest/zip` | POST | ⚠️ DEPRECATED |
| `/health` | GET | ⚠️ DEPRECATED |

### After (v1)

| New Endpoint | Method | Status |
|--------------|--------|--------|
| `/api/v1/docs/search` | GET | ✅ ACTIVE |
| `/api/v1/ingest/zip` | POST | ✅ ACTIVE |
| `/api/v1/health` | GET | ✅ ACTIVE |

---

## Migration Steps

### Frontend Migration

Update your API client base URL:

**Before:**
```typescript
const client = new RagApiClient({
  baseUrl: 'http://localhost:8080'
});
```

**After:**
```typescript
const client = new RagApiClient({
  baseUrl: 'http://localhost:8080/api/v1'
});
```

### cURL Examples

**Search (Before):**
```bash
curl "http://localhost:8080/docs/search?q=AI&k=5"
```

**Search (After):**
```bash
curl "http://localhost:8080/api/v1/docs/search?q=AI&k=5"
```

**Ingest (Before):**
```bash
curl -X POST -F "file=@docs.zip" "http://localhost:8080/ingest/zip"
```

**Ingest (After):**
```bash
curl -X POST -F "file=@docs.zip" "http://localhost:8080/api/v1/ingest/zip"
```

**Health (Before):**
```bash
curl "http://localhost:8080/health"
```

**Health (After):**
```bash
curl "http://localhost:8080/api/v1/health"
```

---

## Response Format Changes

### Health Endpoint

**Before (Map):**
```json
{
  "status": "UP",
  "database": "connected"
}
```

**After (HealthResponse):**
```json
{
  "status": "UP",
  "database": "connected",
  "error": null
}
```

**Error Response:**
```json
{
  "status": "DOWN",
  "database": "disconnected",
  "error": "Connection refused"
}
```

### ProgressEvent (SSE)

**Before (6 fields):**
```json
{
  "stage": "INDEXED",
  "file": "document.pdf",
  "page": 1,
  "processed": 5,
  "total": 10,
  "message": "ok"
}
```

**After (7 fields):**
```json
{
  "stage": "INDEXED",
  "file": "document.pdf",
  "page": 1,
  "processed": 5,
  "total": 10,
  "message": "ok",
  "error": null
}
```

**Error Event:**
```json
{
  "stage": "ERROR",
  "file": "document.pdf",
  "page": null,
  "processed": 5,
  "total": 10,
  "message": "Failed to process",
  "error": "Invalid PDF format"
}
```

---

## Backward Compatibility

### Deprecation Timeline

- **2025-01-24**: v1 endpoints released, old endpoints deprecated
- **2025-04-24**: Old endpoints will return 410 Gone (3 months)
- **2025-07-24**: Old endpoints removed (6 months)

### Supporting Both Versions (Temporary)

If you need to support both old and new clients temporarily, you can add route aliases:

```java
@RestController
public class LegacyRouteController {
    
    private final DocumentController docController;
    private final ZipController zipController;
    private final HealthController healthController;
    
    // Delegate old routes to new controllers
    @GetMapping("/docs/search")
    public List<ChunkRecord> searchLegacy(@RequestParam String q, @RequestParam(required=false) Integer k) {
        return docController.search(q, k);
    }
    
    @PostMapping("/ingest/zip")
    public Flux<ServerSentEvent<ProgressEvent>> uploadLegacy(/* params */) {
        return zipController.upload(/* params */);
    }
    
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> healthLegacy() {
        return healthController.health();
    }
}
```

---

## Testing

### Verify v1 Endpoints

```bash
# Test search
curl "http://localhost:8080/api/v1/docs/search?q=test&k=3"

# Test health
curl "http://localhost:8080/api/v1/health"

# Test ingest (with SSE streaming)
curl -X POST -F "file=@test.zip" "http://localhost:8080/api/v1/ingest/zip" --no-buffer
```

### Integration Tests

Update your test base URLs:

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiV1IntegrationTest {
    
    @LocalServerPort
    private int port;
    
    @Test
    void searchEndpointWorks() {
        String url = "http://localhost:" + port + "/api/v1/docs/search?q=test&k=5";
        // ... test logic
    }
}
```

---

## Benefits

1. **Version Management**: Clear API versioning for future changes
2. **Type Safety**: Structured responses instead of generic maps
3. **Better Error Handling**: Dedicated error field in ProgressEvent
4. **Backward Compatibility**: Old endpoints can be deprecated gracefully
5. **API Documentation**: Easier to document versioned APIs

---

## Troubleshooting

### 404 Not Found

**Problem**: Old endpoints return 404  
**Solution**: Update base URL to include `/api/v1`

### Type Mismatch

**Problem**: Frontend expects `error` field but gets undefined  
**Solution**: Update backend to latest version with 7-field ProgressEvent

### CORS Issues

**Problem**: CORS errors with new endpoints  
**Solution**: Update CORS configuration to allow `/api/v1/**` pattern

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/v1/**")
            .allowedOrigins("*")
            .allowedMethods("GET", "POST", "OPTIONS");
    }
}
```

---

## Future Versions

### Planned for v2

- Pagination support for search results
- Batch document deletion
- Advanced filtering options
- GraphQL endpoint (optional)

### Version Negotiation

Future versions may support content negotiation:

```bash
# Request specific version via header
curl -H "Accept: application/vnd.astradesk.v2+json" \
  "http://localhost:8080/api/docs/search?q=test"
```

---

**Author**: Cartesian School - Siergiej Sobolewski  
**Last Updated**: 2025-01-24
