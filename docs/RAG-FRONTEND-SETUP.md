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

**Last Updated**: 2025-01-24  
**Author**: Cartesian School - Siergej Sobolewski  
**Contact**: s.sobolewski@hotmail.com
