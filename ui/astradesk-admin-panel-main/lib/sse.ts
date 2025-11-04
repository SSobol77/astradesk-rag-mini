// SSE helper with auto-reconnect for /runs/stream

import { env, getAuthToken } from "./env"

export interface SSEOptions {
  onMessage: (data: unknown) => void
  onError?: (error: Error) => void
  onOpen?: () => void
  maxRetries?: number
  retryDelay?: number
}

export class SSEClient {
  private eventSource: EventSource | null = null
  private retryCount = 0
  private maxRetries: number
  private retryDelay: number
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(
    private endpoint: string,
    private options: SSEOptions,
  ) {
    this.maxRetries = options.maxRetries ?? 5
    this.retryDelay = options.retryDelay ?? 3000
  }

  connect(): void {
    const token = getAuthToken()
    if (!token) {
      this.options.onError?.(new Error("No auth token available"))
      return
    }

    // EventSource doesn't support custom headers, so we pass token as query param
    const url = `${env.API_BASE_URL}${this.endpoint}?token=${encodeURIComponent(token)}`

    this.eventSource = new EventSource(url)

    this.eventSource.onopen = () => {
      console.log("[v0] SSE connection opened")
      this.retryCount = 0
      this.options.onOpen?.()
    }

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.options.onMessage(data)
      } catch (error) {
        console.error("[v0] Failed to parse SSE message:", error)
      }
    }

    this.eventSource.onerror = (error) => {
      console.error("[v0] SSE error:", error)
      this.eventSource?.close()
      this.eventSource = null

      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1)
        console.log(`[v0] Reconnecting in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`)

        this.reconnectTimeout = setTimeout(() => {
          this.connect()
        }, delay)
      } else {
        this.options.onError?.(new Error("Max reconnection attempts reached"))
      }
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.retryCount = 0
  }
}
