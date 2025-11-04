# AstraDesk RAG Frontend - Setup & Installation

## 🎯 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd ui/astradesk-admin-panel-main

# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### 2. Environment Configuration

Create `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_API_DEBUG=false
NEXT_PUBLIC_API_MOCK=false
NEXT_PUBLIC_API_MAX_RETRIES=3
```

### 3. Start Development Server

```bash
pnpm dev
# or
npm run dev
```

Visit `http://localhost:3000`

---

## 📦 What's Included

✅ **Type-safe API Client** - `lib/rag-api-client.ts`
✅ **Auto-generated Types** - `lib/rag-api.types.ts`
✅ **React Hooks** - `hooks/use-rag.ts`
✅ **UI Components** - `components/rag/`
✅ **OpenAPI Spec** - `openapi/RAG-API.yaml`
✅ **Configuration** - `lib/rag-api.config.ts`

---

## 🔧 Available Scripts

Update your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "rag:types:gen": "echo 'Types are pre-generated. Run tool to regenerate if needed.'",
    "rag:api:docs": "echo 'View docs at http://localhost:3000/api-docs'",
    "rag:test": "jest --testPathPattern='rag' --watch"
  }
}
```

**Commands:**
```bash
pnpm run dev           # Start dev server
pnpm run build         # Build for production
pnpm run start         # Start production server
pnpm run lint          # Run ESLint
pnpm run rag:types:gen # Regenerate types from OpenAPI
pnpm run rag:api:docs  # Open API documentation
pnpm run rag:test      # Run RAG tests
```

---

## 🚀 Integration Steps

### Step 1: Import in Your Component

```typescript
"use client";

import { useRagSearch } from "@/hooks/use-rag";
import { SearchResults } from "@/components/rag";

export default function Page() {
  const { search, results, isLoading } = useRagSearch();

  return (
    <div>
      <button onClick={() => search({ q: "test", k: 5 })}>
        Search
      </button>
      <SearchResults results={results} isLoading={isLoading} />
    </div>
  );
}
```

### Step 2: Update Layout

```typescript
// app/layout.tsx
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

### Step 3: Create RAG Pages

```typescript
// app/search/page.tsx
"use client";

import { useState } from "react";
import { useRagSearch } from "@/hooks/use-rag";
import { SearchResults, SearchResultDetail } from "@/components/rag";

export default function SearchPage() {
  const [selected, setSelected] = useState(null);
  const { search, results, isLoading, error } = useRagSearch();

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      <div className="col-span-2">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => search({ q: e.target.value, k: 10 })}
        />
        <SearchResults
          results={results}
          isLoading={isLoading}
          error={error}
          onSelect={setSelected}
        />
      </div>
      <SearchResultDetail chunk={selected} />
    </div>
  );
}
```

```typescript
// app/ingest/page.tsx
"use client";

import { IngestPanel } from "@/components/rag";

export default function IngestPage() {
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Upload Documents</h1>
      <IngestPanel
        onSuccess={() => alert("Documents ingested successfully!")}
      />
    </div>
  );
}
```

---

## 🧪 Testing Setup

### Unit Tests

Create `__tests__/hooks/rag.test.ts`:

```typescript
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRagSearch } from "@/hooks/use-rag";

jest.mock("@/lib/rag-api-client", () => ({
  getRagApiClient: jest.fn(() => ({
    search: jest.fn().mockResolvedValue([
      {
        id: 1,
        docId: 1,
        chunkIndex: 0,
        content: "Test content",
        score: 0.95,
      },
    ]),
  })),
}));

describe("useRagSearch", () => {
  test("should search and return results", async () => {
    const { result } = renderHook(() => useRagSearch());

    act(() => {
      result.current.search({ q: "test", k: 5 });
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });
  });
});
```

### E2E Tests

Create `e2e/rag.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("search functionality", async ({ page }) => {
  await page.goto("http://localhost:3000/search");

  // Type search query
  await page.fill('input[placeholder="Search"]', "pgvector");

  // Wait for results
  await page.waitForSelector("[data-testid='search-results']");

  // Verify results appear
  const results = await page.locator("[data-testid='result-card']").count();
  expect(results).toBeGreaterThan(0);
});
```

---

## 📊 Monitoring & Debugging

### Enable Debug Mode

```bash
# .env.local
NEXT_PUBLIC_API_DEBUG=true
```

Check browser console for detailed logs:
```
[RAG API] Client initialized
[RAG API] GET /docs/search?q=test&k=5
[RAG API] GET 200
```

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by Fetch/XHR requests
4. View request/response details
5. Check for errors in Console

### API Testing

Use curl from backend:

```bash
# Search
curl -X GET "http://localhost:8080/docs/search?q=test&k=5"

# Ingest (streaming)
curl -X POST \
  -F "file=@docs.zip" \
  -F "collection=test" \
  "http://localhost:8080/ingest/zip" \
  --no-buffer

# Health
curl "http://localhost:8080/health"
```

---

## 🔐 Security Configuration

### CORS Setup

In `.env.local`:
```bash
# Production only
NEXT_PUBLIC_API_BASE_URL=https://api.astradesk.com
```

Backend CORS configuration (already configured):
```
rag:
  cors:
    allowed-origins:
      - http://localhost:3000
      - https://app.astradesk.com
```

### Input Sanitization

```typescript
import { sanitize } from "@/lib/validation";

const handleSearch = (query: string) => {
  const clean = sanitize(query);
  search({ q: clean, k: 5 });
};
```

---

## 📈 Performance Tuning

### 1. Code Splitting

The project uses Next.js dynamic imports automatically.

### 2. Image Optimization

```typescript
import Image from "next/image";

<Image
  src="/placeholder.jpg"
  alt="Document"
  width={400}
  height={300}
/>
```

### 3. API Response Caching

```typescript
const { search } = useRagSearchAdvanced({
  cacheTime: 5 * 60 * 1000 // Cache 5 minutes
});
```

### 4. Connection Pooling

Automatically handled by browser fetch API.

---

## 🐛 Troubleshooting

### Issue: "API Base URL is not configured"

**Error:**
```
API configuration error: Base URL not set
```

**Solution:**
```bash
# Check .env.local
echo $NEXT_PUBLIC_API_BASE_URL

# Add to .env.local if missing
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Issue: CORS Errors

**Error:**
```
Access to XMLHttpRequest blocked by CORS
```

**Solution:**
1. Ensure backend is running: `./gradlew bootRun`
2. Check CORS configuration
3. Use proxy for development:

```typescript
// next.config.mjs
export default {
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/:path*",
      },
    ],
  }),
};
```

Then use:
```typescript
const client = new RagApiClient({
  baseUrl: "/api" // Proxied to backend
});
```

### Issue: File Upload Fails

**Error:**
```
413 Payload Too Large
```

**Solution:**
Increase max file size in backend:
```yaml
server:
  servlet:
    multipart:
      max-file-size: 1GB
      max-request-size: 1GB
```

### Issue: Search Takes Too Long

**Error:**
```
Search timeout after 30 seconds
```

**Solution:**
```typescript
// Increase timeout
const client = new RagApiClient({
  timeout: 60000 // 60 seconds
});

// Or reduce results
search({ q: "query", k: 3 });
```

---

## 📚 Additional Resources

- **OpenAPI Spec**: `/openapi/RAG-API.yaml`
- **API Guide**: `/RAG-FRONTEND-GUIDE.md`
- **Backend Readme**: `/README.md`
- **Type Definitions**: `/lib/rag-api.types.ts`
- **API Client**: `/lib/rag-api-client.ts`
- **React Hooks**: `/hooks/use-rag.ts`

---

## 🚀 Deployment

### Production Build

```bash
# Build
pnpm run build

# Start
pnpm run start

# Or use Docker
docker build -t astradesk-rag-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=https://api.astradesk.com astradesk-rag-frontend
```

### Environment Variables (Production)

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.astradesk.com
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_API_DEBUG=false
NEXT_PUBLIC_API_MOCK=false
NEXT_PUBLIC_API_MAX_RETRIES=3
```

### Monitoring

Set up monitoring for:
- API response times
- Error rates
- File upload success rate
- Search query distribution

---

## ✅ Verification Checklist

- ✅ All dependencies installed
- ✅ Environment variables configured
- ✅ Backend running on port 8080
- ✅ Frontend running on port 3000
- ✅ Search functionality working
- ✅ File upload working
- ✅ Health check passing
- ✅ No console errors
- ✅ Network requests visible in DevTools

---

## 📞 Support

Having issues? Try:

1. **Check configuration:**
   ```bash
   echo "API URL: $NEXT_PUBLIC_API_BASE_URL"
   ```

2. **Enable debug mode:**
   ```bash
   # .env.local
   NEXT_PUBLIC_API_DEBUG=true
   ```

3. **Check backend:**
   ```bash
   curl http://localhost:8080/health
   ```

4. **View logs:**
   - Browser console: F12
   - Backend: Terminal output

5. **Reset and rebuild:**
   ```bash
   rm -rf node_modules .next
   pnpm install
   pnpm run build
   pnpm run dev
   ```

---

**Last Updated:** 2025-11-04  
**Version:** 0.2.0  
**Status:** Production Ready
