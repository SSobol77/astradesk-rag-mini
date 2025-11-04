// Generated TypeScript types from OpenAPI 3.1 spec

export type AgentEnv = "draft" | "dev" | "staging" | "prod"
export type UserRole = "admin" | "operator" | "viewer"
export type DatasetType = "s3" | "postgres" | "git"
export type HealthStatusType = "healthy" | "degraded" | "down"
export type ExportFormat = "json" | "ndjson"

export interface ErrorResponse {
  detail: string
}

export interface HealthStatus {
  status: HealthStatusType
  components: Record<string, string>
}

export interface UsageMetrics {
  total_requests: number
  cost_usd: number
  latency_p95_ms: number
}

export interface Agent {
  id: string
  name: string
  version: string
  env: AgentEnv
  status: string
  config?: Record<string, unknown>
}

export interface Flow {
  id: string
  name: string
  graph: Record<string, unknown>
}

export interface Dataset {
  id: string
  name: string
  type: DatasetType
  indexing_status: string
}

export interface Connector {
  id: string
  name: string
  type: string
}

export interface Secret {
  id: string
  name: string
  type: string
  last_used_at?: string
}

export interface Run {
  id: string
  agent_id: string
  status: string
  latency_ms: number
  cost_usd: number
}

export interface Job {
  id: string
  name: string
  schedule_expr: string
  status: string
}

export interface User {
  id: string
  email: string
  role: UserRole
}

export interface Policy {
  id: string
  name: string
  rego_text: string
}

export interface AuditEntry {
  id: string
  when_ts: string
  user_id: string
  action: string
  resource: string
  signature: string
}

export interface Setting {
  group: string
  key: string
  value: Record<string, unknown>
}

export interface AgentMetrics {
  p95_latency?: number
}

export interface AgentIO {
  input: string
  output: string
}

export interface IntentGraph {
  nodes: Array<Record<string, unknown>>
  edges: Array<Record<string, unknown>>
}

export interface FlowValidation {
  valid: boolean
  errors: string[]
}

export interface FlowDryRun {
  steps: Array<Record<string, unknown>>
}

export interface ConnectorTest {
  success: boolean
}

export interface ConnectorProbe {
  latency_ms: number
}

export interface JobTrigger {
  run_id: string
}

export interface UserInvite {
  invite_id: string
}

export interface MFAReset {
  success: boolean
}

export interface PolicySimulation {
  allow: boolean
  violations: string[]
}

export interface ReindexJob {
  job_id: string
}
