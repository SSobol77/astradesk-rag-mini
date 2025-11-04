/**
 * RAG API Configuration
 * Centralized configuration for RAG API client and hooks
 */

import { RagApiClientConfig } from "./rag-api-client";

/**
 * Default configuration for RAG API client
 *
 * Environment variables override:
 * - NEXT_PUBLIC_API_BASE_URL - API endpoint
 * - NEXT_PUBLIC_API_TIMEOUT - Request timeout (ms)
 * - NEXT_PUBLIC_API_DEBUG - Enable debug logging
 * - NEXT_PUBLIC_API_MOCK - Enable mock mode
 * - NEXT_PUBLIC_API_MAX_RETRIES - Max retry attempts
 */
export const RAG_API_CONFIG: RagApiClientConfig = {
  // API endpoint
  baseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",

  // Request timeout in milliseconds
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000", 10),

  // Enable debug logging
  debug: process.env.NEXT_PUBLIC_API_DEBUG === "true",

  // Enable mock mode (for testing without backend)
  mockMode: process.env.NEXT_PUBLIC_API_MOCK === "true",

  // Maximum retry attempts for failed requests
  maxRetries: parseInt(process.env.NEXT_PUBLIC_API_MAX_RETRIES || "3", 10),
};

/**
 * Search hook configuration
 */
export const SEARCH_CONFIG = {
  // Default k value for search results
  defaultK: 5,

  // Maximum k value allowed
  maxK: 100,

  // Debounce delay for search input (ms)
  debounceMs: 300,

  // Cache results for this duration (ms)
  cacheTime: 5 * 60 * 1000, // 5 minutes

  // Maximum cache size (number of queries)
  maxCacheSize: 50,
};

/**
 * Ingest hook configuration
 */
export const INGEST_CONFIG = {
  // Default collection name
  defaultCollection: "default",

  // Default chunk maximum length (characters)
  defaultMaxLen: 1200,

  // Default chunk overlap (characters)
  defaultOverlap: 200,

  // Minimum chunk length
  minChunkLen: 100,

  // Maximum chunk length
  maxChunkLen: 5000,

  // Minimum overlap
  minOverlap: 0,

  // Maximum overlap
  maxOverlap: 1000,

  // Request timeout for ingestion (ms) - longer than regular requests
  timeout: 5 * 60 * 1000, // 5 minutes
};

/**
 * Health check configuration
 */
export const HEALTH_CONFIG = {
  // Default interval for health checks (ms)
  defaultInterval: 60000, // 1 minute

  // Request timeout for health checks (ms)
  timeout: 10000, // 10 seconds

  // Auto-check health on mount
  autoCheck: true,
};

/**
 * UI Component configuration
 */
export const UI_CONFIG = {
  // Results per page for pagination
  resultsPerPage: 10,

  // Show top N results by default
  defaultTopResults: 5,

  // Relevance score format
  scoreFormat: "percentage", // "percentage" | "decimal"

  // Enable chunk content preview in search results
  showContentPreview: true,

  // Maximum characters to show in preview
  previewLength: 200,

  // Show result ranking
  showRanking: true,

  // Show document metadata (doc ID, chunk index, page numbers)
  showMetadata: true,

  // Show relevance score badge
  showScore: true,

  // Ingest panel max file size (bytes)
  maxFileSize: 1024 * 1024 * 1024, // 1GB

  // Supported file types for upload
  supportedFileTypes: [".zip"],

  // Show ingestion progress bar
  showProgressBar: true,

  // Show ingestion event log
  showEventLog: true,
};

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
  // Enable semantic search
  enableSearch: true,

  // Enable document ingestion
  enableIngest: true,

  // Enable health monitoring
  enableHealth: true,

  // Enable caching for search results
  enableSearchCache: true,

  // Enable debouncing for search input
  enableSearchDebounce: true,

  // Enable batch upload queue
  enableBatchUpload: true,

  // Enable advanced search features
  enableAdvancedSearch: true,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_QUERY: "Search query is required and cannot be empty",
  INVALID_FILE: "Please select a valid ZIP file",
  FILE_TOO_LARGE: `File size exceeds maximum limit of ${INGEST_CONFIG.maxChunkLen} MB`,
  NETWORK_ERROR: "Network connection failed. Please check your internet connection.",
  API_ERROR: "API request failed. Please try again.",
  PARSE_ERROR: "Failed to parse response from server.",
  TIMEOUT: "Request timed out. Please try again.",
  NOT_FOUND: "Resource not found.",
  UNAUTHORIZED: "Unauthorized. Please check your credentials.",
  FORBIDDEN: "Access denied.",
  SERVER_ERROR: "Server error. Please try again later.",
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  SEARCH_SUCCESS: "Search completed successfully",
  INGEST_SUCCESS: "Document ingestion completed successfully",
  HEALTH_OK: "Service is healthy",
};

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  // Search query
  query: {
    minLength: 1,
    maxLength: 1000,
  },

  // Collection name
  collection: {
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },

  // Chunk parameters
  chunk: {
    maxLen: {
      min: INGEST_CONFIG.minChunkLen,
      max: INGEST_CONFIG.maxChunkLen,
    },
    overlap: {
      min: INGEST_CONFIG.minOverlap,
      max: INGEST_CONFIG.maxOverlap,
    },
  },
};

/**
 * API response status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * SSE progress stages
 */
export const PROGRESS_STAGES = {
  RECEIVED: "RECEIVED",
  PROCESSING: "PROCESSING",
  INDEXED: "INDEXED",
  ERROR: "ERROR",
  DONE: "DONE",
} as const;

/**
 * Health status values
 */
export const HEALTH_STATUS = {
  UP: "UP",
  DOWN: "DOWN",
  DEGRADED: "DEGRADED",
} as const;

/**
 * LocalStorage keys for persistence
 */
export const STORAGE_KEYS = {
  // Search history
  SEARCH_HISTORY: "rag:search_history",

  // Last used collection
  LAST_COLLECTION: "rag:last_collection",

  // Ingestion preferences
  INGEST_PREFS: "rag:ingest_preferences",

  // API configuration
  API_CONFIG: "rag:api_config",
};