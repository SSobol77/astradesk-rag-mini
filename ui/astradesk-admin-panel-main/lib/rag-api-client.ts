/**
 * AstraDesk RAG API Client
 *
 * Type-safe, production-ready API client for RAG operations
 * Features:
 * - Full TypeScript support
 * - Comprehensive error handling
 * - Request/response logging
 * - Mock mode support for testing
 * - SSE streaming for ingestion
 * - Retry logic with exponential backoff
 *
 * Usage:
 * ```typescript
 * const client = new RagApiClient({
 *   baseUrl: 'http://localhost:8080',
 *   timeout: 30000
 * });
 *
 * const results = await client.search({
 *   q: 'query',
 *   k: 5
 * });
 * ```
 */

import type {
  ChunkResult,
  SearchParams,
  IngestParams,
  ProgressEvent,
  ProgressEventHandler,
  RagApiError,
  HealthCheckResult,
  HealthResponse,
} from "./rag-api.types";
import { RagApiError as RagApiErrorClass } from "./rag-api.types";

export interface RagApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  mockMode?: boolean;
  debug?: boolean;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  retries?: number;
}

/**
 * Production-ready RAG API client
 */
export class RagApiClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private mockMode: boolean;
  private debug: boolean;

  constructor(config: RagApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.mockMode = config.mockMode || false;
    this.debug = config.debug || false;

    if (this.debug) {
      console.log("[RAG API] Client initialized:", { baseUrl: this.baseUrl, mockMode: this.mockMode });
    }
  }

  /**
   * Perform semantic search
   *
   * @param params Search parameters
   * @returns Array of relevant chunks with scores
   *
   * @example
   * ```typescript
   * const results = await client.search({
   *   q: 'How does RAG work?',
   *   k: 10,
   *   collection: 'docs'
   * });
   * ```
   */
  async search(params: SearchParams): Promise<ChunkResult[]> {
    if (!params.q || params.q.trim().length === 0) {
      throw new RagApiErrorClass(400, "Query parameter 'q' is required");
    }

    try {
      return await this.request<ChunkResult[]>("/docs/search", {
        params: {
          q: params.q,
          k: params.k || 5,
          ...(params.collection && { collection: params.collection }),
        },
      });
    } catch (error) {
      this.logError("Search failed", error);
      throw error;
    }
  }

  /**
   * Ingest and index ZIP archive with streaming progress
   *
   * @param file ZIP archive file
   * @param options Ingestion options
   * @param onProgress Callback for progress events
   *
   * @example
   * ```typescript
   * await client.ingest(
   *   zipFile,
   *   {
   *     collection: 'docs',
   *     maxLen: 1200,
   *     overlap: 200
   *   },
   *   (event) => {
   *     console.log(`[${event.stage}] ${event.message}`);
   *     if (event.processed && event.total) {
   *       const percent = (event.processed / event.total) * 100;
   *       console.log(`Progress: ${percent.toFixed(1)}%`);
   *     }
   *   }
   * );
   * ```
   */
  async ingest(
    file: File,
    options?: Omit<IngestParams, "file">,
    onProgress?: ProgressEventHandler
  ): Promise<void> {
    if (!file) {
      throw new RagApiErrorClass(400, "File is required");
    }

    if (!file.name.endsWith(".zip")) {
      throw new RagApiErrorClass(400, "Only ZIP files are supported");
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("collection", options?.collection || "default");
      formData.append("maxLen", String(options?.maxLen || 1200));
      formData.append("overlap", String(options?.overlap || 200));

      await this.requestStream("/ingest/zip", formData, onProgress);
    } catch (error) {
      this.logError("Ingestion failed", error);
      throw error;
    }
  }

  /**
   * Check service health
   *
   * @returns Health status
   */
  async health(): Promise<HealthCheckResult> {
    try {
      const status = await this.request<HealthResponse>("/health");
      const healthy = status.status === "UP" || status.status === "DEGRADED";
      return { healthy, status };
    } catch (error) {
      this.logError("Health check failed", error);
      return {
        healthy: false,
        status: {
          status: "DOWN",
          components: {},
        },
      };
    }
  }

  /**
   * Internal: Generic request handler with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    attempt: number = 1
  ): Promise<T> {
    const { params, timeout, retries, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    try {
      this.logRequest("GET", url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout || this.timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      this.logResponse("GET", url, response.status, data);
      return data as T;
    } catch (error) {
      if (attempt < (retries ?? this.maxRetries)) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        this.log(`Retrying in ${delay}ms (attempt ${attempt}/${retries ?? this.maxRetries})`);
        await this.sleep(delay);
        return this.request<T>(endpoint, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Internal: Stream handler for SSE responses (ingestion)
   */
  private async requestStream(
    endpoint: string,
    body: FormData,
    onProgress?: ProgressEventHandler
  ): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;

    this.logRequest("POST", url);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "POST",
        body,
        signal: controller.signal,
        headers: {
          // FormData sets Content-Type automatically
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      await this.parseSSEStream(response, onProgress);
      this.logResponse("POST", url, response.status, "stream completed");
    } catch (error) {
      this.logError("Stream request failed", error);
      throw error;
    }
  }

  /**
   * Internal: Parse Server-Sent Events stream
   */
  private async parseSSEStream(response: Response, onProgress?: ProgressEventHandler): Promise<void> {
    if (!response.body) {
      throw new RagApiErrorClass(500, "Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      for (;;) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6)) as ProgressEvent;
              this.log(`[${event.stage}] ${event.message}`);
              onProgress?.(event);

              // Stop if error
              if (event.stage === "ERROR") {
                throw new RagApiErrorClass(500, event.error || "Ingestion error");
              }
            } catch (error) {
              if (error instanceof RagApiErrorClass) throw error;
              this.logError("Failed to parse SSE event", error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Internal: Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const contentType = response.headers.get("content-type");

    let errorDetail = "Unknown error";
    let errorInstance = response.url;

    try {
      if (contentType?.includes("application/json")) {
        const error = await response.json();
        errorDetail = error.detail || error.message || errorDetail;
        errorInstance = error.instance || errorInstance;
      } else {
        errorDetail = await response.text();
      }
    } catch {
      errorDetail = response.statusText || errorDetail;
    }

    this.logError(`HTTP ${response.status}`, new Error(errorDetail));
    throw new RagApiErrorClass(response.status, errorDetail, errorInstance);
  }

  /**
   * Internal: Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  /**
   * Internal: Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Internal: Logging
   */
  private log(message: string, data?: any): void {
    if (this.debug) {
      const prefix = "[RAG API]";
      if (data) {
        console.log(prefix, message, data);
      } else {
        console.log(prefix, message);
      }
    }
  }

  private logRequest(method: string, url: string): void {
    this.log(`${method} ${url}`);
  }

  private logResponse(method: string, url: string, status: number, data: any): void {
    this.log(`${method} ${status}`, data);
  }

  private logError(message: string, error: any): void {
    if (this.debug) {
      console.error("[RAG API] Error:", message, error);
    }
  }
}

/**
 * Singleton instance
 */
let clientInstance: RagApiClient | null = null;

/**
 * Get or create RAG API client singleton
 */
export function getRagApiClient(config?: RagApiClientConfig): RagApiClient {
  if (!clientInstance) {
    clientInstance = new RagApiClient(config);
  }
  return clientInstance;
}

/**
 * Reset client singleton (useful for testing)
 */
export function resetRagApiClient(): void {
  clientInstance = null;
}