// Mock data for testing without backend API

import type {
  Agent,
  HealthStatus,
  UsageMetrics,
  Flow,
  Dataset,
  Connector,
  Secret,
  User,
  Role,
  Policy,
  AuditEntry,
  Run,
  Job,
} from "@/openapi/openapi-types"

export const mockAgents: Agent[] = [
  {
    id: "agent-001",
    name: "Customer Support Agent",
    version: "1.2.0",
    env: "prod",
    status: "active",
    model: "gpt-4",
    system_prompt: "You are a helpful customer support assistant.",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-20T14:30:00Z",
  },
  {
    id: "agent-002",
    name: "Sales Assistant",
    version: "2.0.1",
    env: "staging",
    status: "active",
    model: "claude-3-opus",
    system_prompt: "You are a sales assistant helping customers find products.",
    created_at: "2025-02-01T09:00:00Z",
    updated_at: "2025-02-10T11:15:00Z",
  },
  {
    id: "agent-003",
    name: "Data Analyst",
    version: "0.9.0",
    env: "dev",
    status: "inactive",
    model: "gpt-4-turbo",
    system_prompt: "You analyze data and provide insights.",
    created_at: "2025-03-05T08:00:00Z",
    updated_at: "2025-03-05T08:00:00Z",
  },
]

export const mockHealth: HealthStatus = {
  status: "healthy",
  components: {
    database: "healthy",
    redis: "healthy",
    llm_gateway: "healthy",
    vector_store: "degraded",
  },
}

export const mockUsage: UsageMetrics = {
  total_requests: 125430,
  cost_usd: 1247.89,
  latency_p95_ms: 342,
}

export const mockErrors: string[] = [
  "Agent 'agent-002' failed validation: missing required field 'temperature'",
  "Flow 'onboarding-v2' execution timeout after 30s",
  "Dataset 'customer-faq' reindex failed: connection refused",
]

export const mockFlows: Flow[] = [
  {
    id: "flow-001",
    name: "Customer Onboarding",
    version: "3.1.0",
    status: "active",
    steps: 5,
    created_at: "2025-01-10T10:00:00Z",
  },
  {
    id: "flow-002",
    name: "Order Processing",
    version: "2.5.2",
    status: "active",
    steps: 8,
    created_at: "2025-02-15T14:00:00Z",
  },
]

export const mockDatasets: Dataset[] = [
  {
    id: "ds-001",
    name: "Product Catalog",
    type: "vector",
    size_mb: 245.7,
    record_count: 15420,
    last_indexed: "2025-03-10T08:30:00Z",
  },
  {
    id: "ds-002",
    name: "Customer FAQs",
    type: "vector",
    size_mb: 12.3,
    record_count: 850,
    last_indexed: "2025-03-12T10:15:00Z",
  },
]

export const mockConnectors: Connector[] = [
  {
    id: "conn-001",
    name: "Stripe Payment Gateway",
    type: "api",
    status: "connected",
    last_tested: "2025-03-13T09:00:00Z",
  },
  {
    id: "conn-002",
    name: "Salesforce CRM",
    type: "oauth",
    status: "connected",
    last_tested: "2025-03-13T09:05:00Z",
  },
]

export const mockSecrets: Secret[] = [
  {
    id: "secret-001",
    name: "OPENAI_API_KEY",
    type: "api_key",
    created_at: "2025-01-05T10:00:00Z",
    last_rotated: "2025-03-01T08:00:00Z",
  },
  {
    id: "secret-002",
    name: "DATABASE_PASSWORD",
    type: "password",
    created_at: "2025-01-05T10:05:00Z",
    last_rotated: "2025-02-15T09:00:00Z",
  },
]

export const mockUsers: User[] = [
  {
    id: "user-001",
    email: "admin@astradesk.com",
    name: "Admin User",
    role: "admin",
    mfa_enabled: true,
    last_login: "2025-03-13T08:00:00Z",
  },
  {
    id: "user-002",
    email: "developer@astradesk.com",
    name: "Dev User",
    role: "developer",
    mfa_enabled: false,
    last_login: "2025-03-12T14:30:00Z",
  },
]

export const mockRoles: Role[] = [
  {
    id: "role-001",
    name: "admin",
    permissions: ["*"],
  },
  {
    id: "role-002",
    name: "developer",
    permissions: ["agents:read", "agents:write", "flows:read", "flows:write"],
  },
]

export const mockPolicies: Policy[] = [
  {
    id: "policy-001",
    name: "Rate Limiting",
    type: "opa",
    status: "active",
    created_at: "2025-01-10T10:00:00Z",
  },
  {
    id: "policy-002",
    name: "Data Access Control",
    type: "opa",
    status: "active",
    created_at: "2025-01-15T11:00:00Z",
  },
]

export const mockAuditEntries: AuditEntry[] = [
  {
    id: "audit-001",
    timestamp: "2025-03-13T10:30:00Z",
    user_id: "user-001",
    action: "agent.update",
    resource: "agent-001",
    status: "success",
  },
  {
    id: "audit-002",
    timestamp: "2025-03-13T10:25:00Z",
    user_id: "user-002",
    action: "flow.execute",
    resource: "flow-001",
    status: "success",
  },
]

export const mockRuns: Run[] = [
  {
    id: "run-001",
    agent_id: "agent-001",
    status: "completed",
    started_at: "2025-03-13T10:00:00Z",
    completed_at: "2025-03-13T10:00:05Z",
    duration_ms: 5234,
  },
  {
    id: "run-002",
    agent_id: "agent-002",
    status: "failed",
    started_at: "2025-03-13T09:55:00Z",
    completed_at: "2025-03-13T09:55:03Z",
    duration_ms: 3120,
    error: "Timeout waiting for LLM response",
  },
]

export const mockJobs: Job[] = [
  {
    id: "job-001",
    name: "Daily Dataset Reindex",
    schedule: "0 2 * * *",
    status: "active",
    last_run: "2025-03-13T02:00:00Z",
    next_run: "2025-03-14T02:00:00Z",
  },
  {
    id: "job-002",
    name: "Weekly Usage Report",
    schedule: "0 8 * * 1",
    status: "active",
    last_run: "2025-03-11T08:00:00Z",
    next_run: "2025-03-18T08:00:00Z",
  },
]
