# AstraDesk Admin Portal

Enterprise admin panel for AstraDesk microservices - manage agents, datasets, flows, policies, and operational governance.

## Features

- **OpenAPI-First**: Strictly typed from OpenAPI 3.1 spec
- **Next.js 16.0 + React 19.2**: Modern App Router architecture
- **Type-Safe**: Generated TypeScript types from OpenAPI
- **Real-Time**: SSE streaming for live run updates
- **Enterprise UI**: Accessible, responsive, professional design
- **Mock API Mode**: Test UI without backend (development/demo mode)

## Getting Started

### Prerequisites

- Node.js 22+ LTS
- Backend API running (see OpenAPI spec) OR use Mock API mode

### Installation

\`\`\`bash
npm install
\`\`\`

### Environment Setup

Copy `.env.example` to `.env.local`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` and configure your environment:

\`\`\`
# Backend API URL (required if not using mock mode)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/admin/v1

# Set to "true" to use realistic mock data instead of real API
NEXT_PUBLIC_MOCK_API=false
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### Mock API Mode (Testing Without Backend)

For development, testing, or demos without a running backend:

1. Set `NEXT_PUBLIC_MOCK_API=true` in your `.env.local`
2. The app will use realistic mock data for all endpoints
3. All pages will work with simulated data and network delays
4. Perfect for UI development, testing, and demonstrations

**Note**: Mock mode returns predefined data from `lib/mock-data.ts`. No actual API calls are made.

### Authentication

The app uses Bearer JWT authentication. On first load, you'll need to set a token:

1. Obtain a JWT token from your auth system
2. The app will store it in localStorage as `astradesk_token`
3. All API requests include `Authorization: Bearer <token>`

**In Mock Mode**: Authentication is bypassed - no token required.

## Architecture

### Strict OpenAPI Mode

- **No deviations**: UI only renders features that exist in OpenAPI
- **Type safety**: All API calls use generated types
- **Feature guards**: Buttons/menus hidden if operation is missing

### Project Structure

\`\`\`
app/
  (shell)/          # Shared layout with sidebar/topbar
    layout.tsx      # Main shell layout
    page.tsx        # Dashboard
    agents/         # Agent management
    flows/          # Flow management
    datasets/       # Dataset management
    ...
components/
  layout/           # Sidebar, Topbar, Footer
  primitives/       # Button, Card, Modal, etc.
  data/             # DataTable, FilterBar
lib/
  api.ts            # Type-safe fetch wrapper
  sse.ts            # SSE client with reconnect
  guards.ts         # Feature availability checks
  mock-data.ts      # Mock data for development/demo mode
openapi/
  OpenAPI.yaml      # Source of truth
  openapi-types.d.ts # Generated types
\`\`\`

## Available Pages

- **Dashboard** (`/`) - Health, usage, recent errors
- **Agents** (`/agents`) - CRUD, test, promote, metrics
- **Intent Graph** (`/intent-graph`) - Read-only graph visualization
- **Flows** (`/flows`) - Validate, dry run, logs
- **Datasets** (`/datasets`) - Schema, embeddings, reindex
- **Tools** (`/tools`) - Connector management
- **Secrets** (`/secrets`) - Key rotation, disable
- **Runs** (`/runs`) - Live streaming, filters, export
- **Jobs** (`/jobs`) - Schedules, triggers, DLQ
- **RBAC** (`/rbac`) - Users, roles, invites
- **Policies** (`/policies`) - OPA policy management
- **Audit** (`/audit`) - Immutable audit trail
- **Settings** (`/settings`) - Platform configuration

## License

Proprietary - AstraDesk
