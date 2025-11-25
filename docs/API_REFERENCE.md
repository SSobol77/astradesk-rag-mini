# API Reference - AstraDesk RAG Mini

Complete REST API documentation for the AstraDesk RAG Mini service.

## Base URL

```
http://localhost:8080
```

For production, replace with your deployed URL.

## Authentication

### API Key (Optional)

If enabled via configuration, include API key in request header:

```http
X-API-Key: your-api-key-here
```

**Configuration**:
```yaml
rag:
  api-key: ${RAG_API_KEY:}  # Set to enable authentication
```

## Rate Limiting

When enabled, requests are limited per API key (or IP address):

**Default**: 60 requests per minute  
**Header**: `X-RateLimit-Remaining` (remaining requests)  
**Response**: `429 Too Many Requests` when exceeded

**Configuration**:
```yaml
rag:
  rate-limit:
    enabled: false
    requests-per-minute: 60
```

## Endpoints

### 1. Search Documents

Search for semantically similar document chunks.

**Endpoint**: `GET /docs/search`

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query text |
| `k` | integer | No | 5 | Number of results to return |

**Request Example**:

```bash
curl "http://localhost:8080/docs/search?q=Spring%20AI%20embeddings&k=10"
```

**Response**: `200 OK`

```json
[
  {
    "id": 123,
    "docId": 45,
    "chunkIndex": 2,
    "pageFrom": 5,
    "pageTo": 5,
    "sourceKey": "s3://bucket/doc.pdf",
    "content": "Spring AI provides a unified API for working with embeddings...",
    "score": 0.9234,
    "createdAt": "2025-01-20T10:30:00Z"
  },
  {
    "id": 124,
    "docId": 45,
    "chunkIndex": 3,
    "pageFrom": 6,
    "pageTo": 6,
    "sourceKey": "s3://bucket/doc.pdf",
    "content": "Embeddings are vector representations of text...",
    "score": 0.8876,
    "createdAt": "2025-01-20T10:30:00Z"
  }
]
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | long | Unique chunk identifier |
| `docId` | long | Parent document ID |
| `chunkIndex` | int | Chunk position in document (0-based) |
| `pageFrom` | int | Starting page number (for PDFs) |
| `pageTo` | int | Ending page number (for PDFs) |
| `sourceKey` | string | S3/MinIO storage key |
| `content` | string | Text content of chunk |
| `score` | float | Similarity score (0.0-1.0, higher is better) |
| `createdAt` | string | ISO 8601 timestamp |

**Error Responses**:

```json
// 400 Bad Request - Missing query parameter
{
  "error": "Bad Request",
  "message": "Required parameter 'q' is missing",
  "status": 400
}

// 429 Too Many Requests - Rate limit exceeded
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "status": 429
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "Failed to process search request",
  "status": 500
}
```


---

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
