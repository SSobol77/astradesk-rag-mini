/**
 * React hooks for AstraDesk RAG operations
 *
 * Production-ready hooks with:
 * - State management
 * - Error handling
 * - Loading states
 * - Progress tracking
 * - Memory cleanup
 *
 * Usage:
 * ```typescript
 * function MyComponent() {
 *   const { search, isLoading, error, results } = useRagSearch();
 *
 *   return (
 *     <>
 *       <button onClick={() => search({ q: 'query', k: 5 })}>
 *         Search
 *       </button>
 *       {isLoading && <LoadingSpinner />}
 *       {error && <ErrorMessage error={error} />}
 *       {results?.map(chunk => (
 *         <ChunkCard key={chunk.id} chunk={chunk} />
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getRagApiClient, type RagApiClient } from "@/lib/rag-api-client";
import type {
  ChunkResult,
  SearchParams,
  IngestParams,
  ProgressEvent,
  RagApiError,
  HealthCheckResult,
} from "@/lib/rag-api.types";

/**
 * Search hook - Performs semantic search
 *
 * @example
 * ```typescript
 * const { search, isLoading, results, error } = useRagSearch();
 *
 * const handleSearch = async () => {
 *   await search({ q: 'How does pgvector work?', k: 10 });
 * };
 * ```
 */
export function useRagSearch() {
  const clientRef = useRef<RagApiClient>(null);
  const [results, setResults] = useState<ChunkResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!clientRef.current) {
    clientRef.current = getRagApiClient({ debug: false });
  }

  const search = useCallback(
    async (params: SearchParams) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await clientRef.current!.search(params);
        setResults(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Search failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    search,
    clearResults,
    results,
    isLoading,
    error,
    resultCount: results.length,
  };
}

/**
 * Ingestion hook - Upload and process ZIP archives
 *
 * @example
 * ```typescript
 * const { ingest, isLoading, progress, error } = useRagIngest();
 *
 * const handleFileUpload = async (file: File) => {
 *   await ingest(file, {
 *     collection: 'docs',
 *     maxLen: 1200,
 *     overlap: 200
 *   });
 * };
 * ```
 */
export function useRagIngest() {
  const clientRef = useRef<RagApiClient>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressEvent>({
    stage: "RECEIVED",
    message: "Ready to upload",
  });
  const [totalChunks, setTotalChunks] = useState(0);

  if (!clientRef.current) {
    clientRef.current = getRagApiClient({ debug: false });
  }

  const ingest = useCallback(
    async (file: File, options?: Omit<IngestParams, "file">) => {
      setIsLoading(true);
      setError(null);
      setProgress({ stage: "RECEIVED", message: "Starting upload..." });
      setTotalChunks(0);

      try {
        await clientRef.current!.ingest(file, options, (event) => {
          setProgress(event);
          if (event.total) {
            setTotalChunks(event.total);
          }
        });

        setProgress({
          stage: "DONE",
          message: `Successfully ingested ${totalChunks} chunks`,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Ingestion failed";
        setError(errorMessage);
        setProgress({
          stage: "ERROR",
          message: errorMessage,
          error: errorMessage,
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [totalChunks]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setProgress({ stage: "RECEIVED", message: "Ready to upload" });
    setTotalChunks(0);
  }, []);

  return {
    ingest,
    reset,
    isLoading,
    error,
    progress,
    totalChunks,
    progressPercent:
      progress.processed && progress.total ? (progress.processed / progress.total) * 100 : 0,
  };
}

/**
 * Health check hook - Monitor service status
 *
 * @example
 * ```typescript
 * const { health, isHealthy, isChecking } = useRagHealth({ interval: 30000 });
 *
 * return (
 *   <StatusBadge status={isHealthy ? 'healthy' : 'offline'} />
 * );
 * ```
 */
export function useRagHealth(options?: { interval?: number; autoCheck?: boolean }) {
  const clientRef = useRef<RagApiClient>(null);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  if (!clientRef.current) {
    clientRef.current = getRagApiClient({ debug: false });
  }

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await clientRef.current!.health();
      setHealth(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    if (options?.autoCheck !== false) {
      check();

      if (options?.interval) {
        intervalRef.current = setInterval(check, options.interval);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [check, options?.interval, options?.autoCheck]);

  return {
    check,
    health,
    isHealthy: health?.healthy ?? false,
    isChecking,
    status: health?.status,
  };
}

/**
 * Advanced search hook - With caching and debouncing
 *
 * @example
 * ```typescript
 * const { search, results, isLoading } = useRagSearchAdvanced({
 *   debounceMs: 300,
 *   cacheTime: 5 * 60 * 1000 // 5 minutes
 * });
 *
 * // Auto-search on query change
 * useEffect(() => {
 *   search({ q: 'dynamic query', k: 5 });
 * }, [query]);
 * ```
 */
export interface AdvancedSearchOptions {
  debounceMs?: number;
  cacheTime?: number;
  maxCacheSize?: number;
}

export function useRagSearchAdvanced(options?: AdvancedSearchOptions) {
  const { search: baseSearch, ...baseState } = useRagSearch();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, { results: ChunkResult[]; timestamp: number }>>(new Map());
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

  const debounceMs = options?.debounceMs ?? 300;
  const cacheTime = options?.cacheTime ?? 5 * 60 * 1000;
  const maxCacheSize = options?.maxCacheSize ?? 50;

  const getCacheKey = (params: SearchParams): string => {
    return `${params.q}:${params.k}:${params.collection}`;
  };

  const search = useCallback(
    (params: SearchParams) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const cacheKey = getCacheKey(params);
        const cached = cacheRef.current.get(cacheKey);

        // Check cache validity
        if (cached && Date.now() - cached.timestamp < cacheTime) {
          setCacheStats((prev) => ({ ...prev, hits: prev.hits + 1 }));
          baseSearch.call({ results: cached.results });
          return;
        }

        // Cache miss
        setCacheStats((prev) => ({ ...prev, misses: prev.misses + 1 }));

        // Evict old entries if cache is too large
        if (cacheRef.current.size >= maxCacheSize) {
          const oldestKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(oldestKey);
        }

        baseSearch(params).then((results) => {
          cacheRef.current.set(cacheKey, {
            results,
            timestamp: Date.now(),
          });
        });
      }, debounceMs);
    },
    [baseSearch, debounceMs, cacheTime, maxCacheSize]
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setCacheStats({ hits: 0, misses: 0 });
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    ...baseState,
    search,
    clearCache,
    cacheStats,
    cacheSize: cacheRef.current.size,
  };
}

/**
 * Ingestion queue hook - Handle multiple file uploads
 *
 * @example
 * ```typescript
 * const { queue, add, remove, processQueue, isProcessing } = useRagIngestQueue({
 *   concurrent: 2
 * });
 *
 * const handleDrop = async (files: FileList) => {
 *   for (const file of files) {
 *     add(file);
 *   }
 *   await processQueue();
 * };
 * ```
 */
export interface QueuedFile {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  error?: string;
}

export interface IngestQueueOptions {
  concurrent?: number;
}

export function useRagIngestQueue(options?: IngestQueueOptions) {
  const { ingest: baseIngest } = useRagIngest();
  const [queue, setQueue] = useState<Map<string, QueuedFile>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const concurrentRef = useRef(options?.concurrent ?? 1);
  const activeRef = useRef(0);

  const add = useCallback((file: File) => {
    const id = `${file.name}-${Date.now()}-${Math.random()}`;
    const queuedFile: QueuedFile = {
      id,
      file,
      status: "pending",
      progress: 0,
    };

    setQueue((prev) => new Map(prev).set(id, queuedFile));
  }, []);

  const remove = useCallback((id: string) => {
    setQueue((prev) => {
      const newQueue = new Map(prev);
      newQueue.delete(id);
      return newQueue;
    });
  }, []);

  const processQueue = useCallback(async () => {
    setIsProcessing(true);

    const pending = Array.from(queue.values()).filter((f) => f.status === "pending");

    for (const queuedFile of pending) {
      // Respect concurrent limit
      while (activeRef.current >= concurrentRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      activeRef.current++;

      try {
        setQueue((prev) => {
          const newQueue = new Map(prev);
          newQueue.set(queuedFile.id, { ...queuedFile, status: "processing" });
          return newQueue;
        });

        await baseIngest(queuedFile.file, {}, (event) => {
          const progressPercent = event.processed && event.total ? (event.processed / event.total) * 100 : 0;

          setQueue((prev) => {
            const newQueue = new Map(prev);
            const item = newQueue.get(queuedFile.id);
            if (item) {
              newQueue.set(queuedFile.id, { ...item, progress: progressPercent });
            }
            return newQueue;
          });
        });

        setQueue((prev) => {
          const newQueue = new Map(prev);
          newQueue.set(queuedFile.id, { ...queuedFile, status: "done", progress: 100 });
          return newQueue;
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        setQueue((prev) => {
          const newQueue = new Map(prev);
          newQueue.set(queuedFile.id, {
            ...queuedFile,
            status: "error",
            error: errorMessage,
          });
          return newQueue;
        });
      } finally {
        activeRef.current--;
      }
    }

    setIsProcessing(false);
  }, [queue, baseIngest]);

  const clear = useCallback(() => {
    setQueue(new Map());
    activeRef.current = 0;
  }, []);

  const stats = {
    total: queue.size,
    pending: Array.from(queue.values()).filter((f) => f.status === "pending").length,
    processing: Array.from(queue.values()).filter((f) => f.status === "processing").length,
    done: Array.from(queue.values()).filter((f) => f.status === "done").length,
    errors: Array.from(queue.values()).filter((f) => f.status === "error").length,
  };

  return {
    queue: Array.from(queue.values()),
    add,
    remove,
    clear,
    processQueue,
    isProcessing,
    stats,
  };
}