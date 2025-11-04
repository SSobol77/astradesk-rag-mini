# AstraDesk RAG Frontend Integration Guide

## 📋 Overview

Complete production-ready TypeScript/React integration for the AstraDesk RAG API. This guide provides everything needed to build a semantic search and document ingestion interface.

## 🎯 Features

- ✅ Type-safe API client (`RagApiClient`)
- ✅ React hooks for search & ingestion (`useRagSearch`, `useRagIngest`, etc.)
- ✅ Professional UI components (search results, ingest panel)
- ✅ Server-Sent Events (SSE) streaming support
- ✅ Error handling & retry logic
- ✅ Mock mode for testing
- ✅ Caching & debouncing (advanced hooks)
- ✅ Queue management for batch uploads

---

## 📁 File Structure

```
ui/astradesk-admin-panel-main/
├── lib/
│   ├── rag-api.types.ts          # Auto-generated types
│   └── rag-api-client.ts         # Core API client
├── hooks/
│   └── use-rag.ts                # React hooks
├── components/rag/
│   ├── search-results.tsx        # Search results display
│   ├── ingest-panel.tsx          # Document upload UI
│   └── index.ts                  # Component exports
└── openapi/
    └── RAG-API.yaml              # OpenAPI specification
```

---

## 🚀 Quick Start

### 1. Setup Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_DEBUG=false
NEXT_PUBLIC_MOCK_API=false
```

### 2. Use in a Component

```typescript
"use client";

import { useRagSearch } from "@/hooks/use-rag";
import { SearchResults } from "@/components/rag";

export default function SearchPage() {
  const { search, results, isLoading, error } = useRagSearch();

  const handleSearch = async (query: string) => {
    await search({ q: query, k: 10 });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search documents..."
        onChangeCapture={(e) => handleSearch((e.target as HTMLInputElement).value)}
      />
      <SearchResults results={results} isLoading={isLoading} error={error} />
    </div>
  );
}
```

---

## 🔑 API Client Usage

### Basic Setup

```typescript
import { RagApiClient, getRagApiClient } from "@/lib/rag-api-client";

// Get singleton instance
const client = getRagApiClient({
  baseUrl: "http://localhost:8080",
  timeout: 30000,
  debug: true
});
```

### Search API

```typescript
// Simple search
const results = await client.search({
  q: "How does pgvector work?",
  k: 5,
  collection: "docs"
});

// Handle results
results.forEach((chunk) => {
  console.log(`[${(chunk.score * 100).toFixed(1)}%] ${chunk.content}`);
});
```

### Ingestion API

```typescript
// With progress tracking
await client.ingest(
  zipFile,
  {
    collection: "documentation",
    maxLen: 1200,
    overlap: 200
  },
  (event) => {
    switch (event.stage) {
      case "RECEIVED":
        console.log("ZIP received");
        break;
      case "PROCESSING":
        console.log(`Processing: ${event.file}`);
        break;
      case "INDEXED":
        const progress = (event.processed / event.total) * 100;
        console.log(`Progress: ${progress.toFixed(1)}%`);
        break;
      case "DONE":
        console.log(`Complete: ${event.total} chunks`);
        break;
      case "ERROR":
        console.error(event.error);
        break;
    }
  }
);
```

### Health Check

```typescript
const { healthy, status } = await client.health();

if (healthy) {
  console.log("RAG service is healthy");
  console.log(status.components);
}
```

---

## ⚙️ React Hooks

### `useRagSearch()`

Semantic search with state management.

```typescript
export function SearchComponent() {
  const { search, results, isLoading, error, resultCount } = useRagSearch();

  return (
    <>
      <button onClick={() => search({ q: "query", k: 5 })}>
        Search
      </button>

      {isLoading && <p>Searching...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {results && <p>Found {resultCount} results</p>}
    </>
  );
}
```

**Methods:**
- `search(params)` - Execute search
- `clearResults()` - Clear results and reset state

**State:**
- `results` - ChunkResult[]
- `isLoading` - boolean
- `error` - string | null
- `resultCount` - number

---

### `useRagIngest()`

Document ingestion with progress tracking.

```typescript
export function UploadComponent() {
  const { ingest, isLoading, progress, error, progressPercent } = useRagIngest();

  const handleUpload = async (file: File) => {
    await ingest(file, {
      collection: "docs",
      maxLen: 1200,
      overlap: 200
    });
  };

  return (
    <>
      <input
        type="file"
        accept=".zip"
        onChange={(e) => handleUpload(e.target.files?.[0]!)}
      />

      {isLoading && (
        <>
          <p>{progress.message}</p>
          <progress value={progressPercent} max={100} />
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </>
  );
}
```

**Methods:**
- `ingest(file, options?, onProgress?)` - Upload and process ZIP
- `reset()` - Reset to initial state

**State:**
- `isLoading` - boolean
- `progress` - ProgressEvent
- `error` - string | null
- `totalChunks` - number
- `progressPercent` - 0-100

---

### `useRagHealth()`

Monitor service health with auto-refresh.

```typescript
export function HealthCheckComponent() {
  const { health, isHealthy, isChecking, check } = useRagHealth({
    interval: 30000, // Check every 30 seconds
    autoCheck: true   // Auto-check on mount
  });

  return (
    <>
      <span style={{ color: isHealthy ? "green" : "red" }}>
        {isHealthy ? "🟢 Online" : "🔴 Offline"}
      </span>
      <button onClick={check} disabled={isChecking}>
        Check Now
      </button>
    </>
  );
}
```

---

### `useRagSearchAdvanced()`

Search with caching and debouncing.

```typescript
export function AdvancedSearchComponent() {
  const { search, results, cacheStats, clearCache } = useRagSearchAdvanced({
    debounceMs: 300,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 50
  });

  return (
    <>
      <input
        type="text"
        placeholder="Search (with debouncing)..."
        onChange={(e) => search({ q: e.target.value, k: 5 })}
      />

      <p>
        Cache hits: {cacheStats.hits} | Misses: {cacheStats.misses}
      </p>

      <button onClick={clearCache}>Clear Cache</button>
    </>
  );
}
```

---

### `useRagIngestQueue()`

Handle multiple file uploads concurrently.

```typescript
export function BatchUploadComponent() {
  const { queue, add, processQueue, isProcessing, stats } = useRagIngestQueue({
    concurrent: 3 // Process 3 files simultaneously
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    for (const file of e.dataTransfer.files) {
      if (file.name.endsWith(".zip")) {
        add(file);
      }
    }
  };

  return (
    <>
      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        Drop ZIP files here
      </div>

      <p>
        Queued: {stats.pending} | Processing: {stats.processing} | Done:{" "}
        {stats.done}
      </p>

      <button onClick={processQueue} disabled={isProcessing}>
        Process Queue
      </button>

      <ul>
        {queue.map((file) => (
          <li key={file.id}>
            {file.file.name} - {file.status} ({file.progress.toFixed(1)}%)
          </li>
        ))}
      </ul>
    </>
  );
}
```

---

## 🎨 UI Components

### SearchResults

Display search results with relevance scores.

```typescript
<SearchResults
  results={chunks}
  isLoading={isLoading}
  error={error}
  onSelect={(chunk) => console.log("Selected:", chunk)}
/>
```

**Props:**
- `results` - ChunkResult[]
- `isLoading?` - boolean
- `error?` - string | null
- `onSelect?` - (chunk: ChunkResult) => void

---

### SearchResultDetail

Show full content of a selected chunk.

```typescript
const [selectedChunk, setSelectedChunk] = useState<ChunkResult | null>(null);

return (
  <>
    <SearchResults onSelect={setSelectedChunk} />
    <SearchResultDetail chunk={selectedChunk} />
  </>
);
```

---

### IngestPanel

Complete document ingestion UI with drag-and-drop.

```typescript
<IngestPanel
  defaultCollection="documentation"
  onSuccess={() => console.log("Ingestion complete!")}
/>
```

**Props:**
- `defaultCollection?` - string (default: "default")
- `onSuccess?` - () => void

**Features:**
- Drag & drop upload
- Configurable chunk settings
- Real-time progress tracking
- Error handling
- Success confirmation

---

## 🔧 Error Handling

### API Errors

```typescript
import { RagApiError } from "@/lib/rag-api.types";

try {
  await client.search({ q: "query" });
} catch (error) {
  if (error instanceof RagApiError) {
    console.error(`HTTP ${error.status}: ${error.detail}`);
  }
}
```

### Hook Error States

```typescript
const { error } = useRagSearch();

if (error) {
  return (
    <div className="error">
      <h2>Search Error</h2>
      <p>{error}</p>
    </div>
  );
}
```

---

## 🧪 Testing

### Mock Mode

Enable mock API for testing without backend:

```typescript
// .env.local
NEXT_PUBLIC_MOCK_API=true
```

### Debug Mode

Enable detailed logging:

```typescript
const client = new RagApiClient({
  debug: true
});
```

### Testing Hook

```typescript
import { render, screen } from "@testing-library/react";
import { SearchComponent } from "./search";

test("renders search results", async () => {
  render(<SearchComponent />);
  expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
});
```

---

## 📊 Performance Optimization

### 1. Debounce Search Queries

```typescript
const { search } = useRagSearchAdvanced({
  debounceMs: 300 // Wait 300ms after typing stops
});
```

### 2. Cache Results

```typescript
const { search } = useRagSearchAdvanced({
  cacheTime: 5 * 60 * 1000 // Cache for 5 minutes
});
```

### 3. Lazy Load Results

```typescript
const { results } = useRagSearch();

return (
  <InfiniteScroll
    dataLength={results.length}
    next={() => loadMore()}
    hasMore={hasMore}
  >
    {results.map((chunk) => (...))}
  </InfiniteScroll>
);
```

### 4. Optimize Component Rendering

```typescript
import { memo } from "react";

const ResultCard = memo(({ chunk }) => (
  // Component body
));
```

---

## 🔐 Security Best Practices

### 1. API Key Management

```typescript
// ✅ Good - Use environment variables
const apiKey = process.env.RAG_API_KEY;

// ❌ Bad - Hardcoded
const apiKey = "sk-...";
```

### 2. Input Validation

```typescript
const handleSearch = (query: string) => {
  // Validate input
  if (!query || query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

  search({ q: query, k: 5 });
};
```

### 3. CORS Configuration

```typescript
// Configure in backend or proxy
// Allow only trusted origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

### 4. Secure File Upload

```typescript
const handleFileUpload = (file: File) => {
  // Validate file type
  if (!file.name.endsWith(".zip")) {
    throw new Error("Only ZIP files allowed");
  }

  // Check file size (max 1GB)
  if (file.size > 1024 * 1024 * 1024) {
    throw new Error("File too large");
  }

  ingest(file);
};
```

---

## 📚 Complete Example

Full working example combining all features:

```typescript
"use client";

import React, { useState } from "react";
import { useRagSearch, useRagIngest, useRagHealth } from "@/hooks/use-rag";
import { SearchResults, SearchResultDetail, IngestPanel } from "@/components/rag";
import { Tabs } from "@/components/primitives/tabs";

export default function RagDashboard() {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedChunk, setSelectedChunk] = useState(null);

  // Search
  const { search, results, isLoading: isSearching, error: searchError } = useRagSearch();

  // Ingestion
  const { ingest, isLoading: isIngesting, progress } = useRagIngest();

  // Health
  const { isHealthy } = useRagHealth({ interval: 60000 });

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500"}`} />
        <p className="text-sm text-gray-600">
          Service: {isHealthy ? "Online" : "Offline"}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Search Tab */}
        <div value="search" className="space-y-4">
          <input
            type="text"
            placeholder="Search documents..."
            onChange={(e) => search({ q: e.target.value, k: 10 })}
            className="w-full p-2 border rounded"
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <SearchResults
                results={results}
                isLoading={isSearching}
                error={searchError}
                onSelect={setSelectedChunk}
              />
            </div>

            <div>
              <SearchResultDetail chunk={selectedChunk} />
            </div>
          </div>
        </div>

        {/* Upload Tab */}
        <div value="upload" className="space-y-4">
          <IngestPanel
            defaultCollection="documentation"
            onSuccess={() => setActiveTab("search")}
          />
        </div>
      </Tabs>
    </div>
  );
}
```

---

## 🚀 Deployment

### Environment Variables (Production)

```bash
# Production API endpoint
NEXT_PUBLIC_API_BASE_URL=https://api.astradesk.com

# Disable debug mode
NEXT_PUBLIC_API_DEBUG=false

# Disable mock API
NEXT_PUBLIC_MOCK_API=false
```

### Docker Compose

```yaml
version: "3.8"
services:
  frontend:
    build: ./ui/astradesk-admin-panel-main
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://backend:8080
    depends_on:
      - backend

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
```

---

## 📖 API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/docs/search` | Semantic search |
| POST | `/ingest/zip` | Upload & process ZIP |
| GET | `/health` | Health check |

### Query Parameters

**Search:**
- `q` (required) - Search query
- `k` (optional) - Number of results (default 5)
- `collection` (optional) - Filter by collection

**Ingest:**
- `collection` (optional) - Collection name (default: "default")
- `maxLen` (optional) - Chunk length (default: 1200)
- `overlap` (optional) - Chunk overlap (default: 200)

---

## 🐛 Troubleshooting

### Connection Issues

```
Error: API configuration error: Base URL not set
```

**Solution:** Set `NEXT_PUBLIC_API_BASE_URL` environment variable.

### CORS Errors

```
Access to XMLHttpRequest blocked by CORS
```

**Solution:** Configure CORS on backend or use proxy.

### Large File Upload Fails

```
413 Payload Too Large
```

**Solution:** Increase max upload size in backend configuration.

### Slow Search Queries

```
Query timeout (>30 seconds)
```

**Solution:** Try smaller `k` values, optimize database indexes.

---

## 📞 Support

For issues or questions:
1. Check logs: `console.log()` in browser dev tools
2. Enable debug: `debug: true` in API client config
3. Review API spec: `/openapi/RAG-API.yaml`
4. Check backend: Run `./gradlew bootRun`

---

## 📝 Changelog

### v0.2.0 (Current)
- ✅ Auto-generated TypeScript types
- ✅ Professional API client
- ✅ React hooks (search, ingest, health, advanced)
- ✅ UI components (search results, ingest panel)
- ✅ Error handling & retry logic
- ✅ SSE streaming support

### v0.1.0
- Initial AdminIngestPanel component

---

## 📄 License

MIT - See LICENSE file

---

**Last Updated:** 2025-11-04  
**Version:** 0.2.0  
**Status:** Production Ready