/**
 * AstraDesk RAG API - Auto-generated TypeScript types
 * Generated from openapi/RAG-API.yaml
 *
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * This file is auto-generated from the OpenAPI specification
 * Update RAG-API.yaml and regenerate using: npm run rag:types:gen
 */

/**
 * Document chunk with embedding relevance score
 */
export interface ChunkResult {
  /** Unique chunk ID */
  id: number;

  /** Parent document ID */
  docId: number;

  /** Sequential chunk number within document */
  chunkIndex: number;

  /** Starting page number (PDF only) */
  pageFrom?: number | null;

  /** Ending page number (PDF only) */
  pageTo?: number | null;

  /** Chunk text content */
  content: string;

  /** Relevance score (0-1, higher is more relevant) */
  score: number;
}

/**
 * Ingestion progress event (Server-Sent Event payload)
 */
export interface ProgressEvent {
  /** Current processing stage */
  stage: "RECEIVED" | "PROCESSING" | "INDEXED" | "ERROR" | "DONE";

  /** Current file being processed */
  file?: string;

  /** Current page number (PDF only) */
  page?: number;

  /** Number of chunks processed so far */
  processed?: number;

  /** Total chunks expected */
  total?: number;

  /** Human-readable status message */
  message: string;

  /** Error message if stage is ERROR */
  error?: string | null;
}

/**
 * Error response following RFC 7807 Problem Details
 */
export interface ErrorResponse {
  /** Error description */
  detail: string;

  /** HTTP status code (optional) */
  status?: number;

  /** Error title (optional) */
  title?: string;

  /** Request URI (optional) */
  instance?: string;
}

/**
 * Service health status
 */
export interface HealthResponse {
  /** Overall health status */
  status: "UP" | "DOWN" | "DEGRADED";

  /** Individual component status */
  components?: Record<string, { status: string; details?: Record<string, any> }>;
}

/**
 * Search request parameters
 */
export interface SearchParams {
  /** Search query text */
  q: string;

  /** Number of results to return (default 5) */
  k?: number;

  /** Filter by collection name (optional) */
  collection?: string;
}

/**
 * Ingestion request parameters
 */
export interface IngestParams {
  /** ZIP archive file */
  file: File;

  /** Collection name for grouping (default "default") */
  collection?: string;

  /** Maximum chunk length in characters (default 1200) */
  maxLen?: number;

  /** Character overlap between chunks (default 200) */
  overlap?: number;
}

/**
 * Ingestion progress callback handler
 */
export type ProgressEventHandler = (event: ProgressEvent) => void;

/**
 * API error with structured information
 */
export class RagApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public instance?: string
  ) {
    super(detail);
    this.name = "RagApiError";
  }
}

/**
 * Health check response
 */
export interface HealthCheckResult {
  healthy: boolean;
  status: HealthResponse;
}

/**
 * Search result with metadata
 */
export interface SearchResult {
  chunks: ChunkResult[];
  totalCount: number;
  executionTimeMs: number;
}

/**
 * Ingestion summary
 */
export interface IngestSummary {
  totalChunks: number;
  successfulChunks: number;
  failedChunks: number;
  duration: string;
  errors: string[];
}