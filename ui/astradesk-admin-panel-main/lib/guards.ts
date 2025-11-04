// Feature guards - hide UI if operation is missing in OpenAPI

export const AVAILABLE_OPERATIONS = {
  // Dashboard
  "GET /health": true,
  "GET /usage/llm": true,
  "GET /errors/recent": true,

  // Agents
  "GET /agents": true,
  "POST /agents": true,
  "PUT /agents/{id}": true,
  "POST /agents/{id}:test": true,
  "POST /agents/{id}:clone": true,
  "POST /agents/{id}:promote": true,
  "GET /agents/{id}/metrics": true,
  "GET /agents/{id}/io": true,

  // Intent Graph
  "GET /intents/graph": true,

  // Flows
  "GET /flows": true,
  "POST /flows": true,
  "POST /flows/{id}:validate": true,
  "POST /flows/{id}:dryrun": true,
  "GET /flows/{id}/log": true,

  // Datasets
  "GET /datasets": true,
  "POST /datasets": true,
  "GET /datasets/{id}/schema": true,
  "GET /datasets/{id}/embeddings": true,
  "POST /datasets/{id}:reindex": true,

  // Connectors
  "GET /connectors": true,
  "POST /connectors": true,
  "POST /connectors/{id}:test": true,
  "POST /connectors/{id}:probe": true,

  // Secrets
  "GET /secrets": true,
  "POST /secrets": true,
  "POST /secrets/{id}:rotate": true,
  "POST /secrets/{id}:disable": true,

  // Runs
  "GET /runs": true,
  "GET /runs/stream": true,
  "GET /runs/{id}": true,
  "GET /logs/export": true,

  // Jobs
  "GET /jobs": true,
  "POST /jobs": true,
  "POST /jobs/{id}:trigger": true,
  "POST /jobs/{id}:pause": true,
  "GET /dlq": true,

  // Users & Roles
  "GET /users": true,
  "POST /users:invite": true,
  "POST /users/{id}:reset-mfa": true,
  "POST /users/{id}:role": true,
  "GET /roles": true,

  // Policies
  "GET /policies": true,
  "POST /policies": true,
  "PUT /policies/{id}": true,
  "POST /policies/{id}:simulate": true,

  // Audit
  "GET /audit": true,
  "GET /audit/export": true,
  "GET /audit/{id}": true,

  // Settings
  "GET /settings/integrations": true,
  "PUT /settings/integrations": true,
  "GET /settings/localization": true,
  "PUT /settings/localization": true,
  "GET /settings/platform": true,
  "PUT /settings/platform": true,
} as const

export function hasOperation(operation: keyof typeof AVAILABLE_OPERATIONS): boolean {
  return AVAILABLE_OPERATIONS[operation] === true
}
