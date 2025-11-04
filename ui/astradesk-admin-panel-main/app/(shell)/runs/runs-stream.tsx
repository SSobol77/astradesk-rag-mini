"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Badge } from "@/components/primitives/badge"
import { Button } from "@/components/primitives/button"
import { SSEClient } from "@/lib/sse"
import type { Run } from "@/openapi/openapi-types"

export function RunsStream() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [runs, setRuns] = useState<Run[]>([])
  const [client, setClient] = useState<SSEClient | null>(null)

  const handleToggleStream = () => {
    if (isStreaming) {
      client?.disconnect()
      setClient(null)
      setIsStreaming(false)
    } else {
      const newClient = new SSEClient("/runs/stream", {
        onMessage: (data) => {
          console.log("[v0] Received run update:", data)
          setRuns((prev) => [data as Run, ...prev].slice(0, 10))
        },
        onError: (error) => {
          console.error("[v0] SSE error:", error)
          setIsStreaming(false)
        },
        onOpen: () => {
          console.log("[v0] SSE connection opened")
        },
      })
      newClient.connect()
      setClient(newClient)
      setIsStreaming(true)
    }
  }

  useEffect(() => {
    return () => {
      client?.disconnect()
    }
  }, [client])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Live Stream</CardTitle>
        <Button variant={isStreaming ? "danger" : "primary"} size="sm" onClick={handleToggleStream}>
          {isStreaming ? "Stop Stream" : "Start Stream"}
        </Button>
      </CardHeader>
      <CardContent>
        {isStreaming && runs.length === 0 && <p className="text-sm text-muted-foreground">Waiting for new runs...</p>}
        {runs.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {runs.map((run, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span className="font-mono text-xs">{run.id.substring(0, 12)}...</span>
                <Badge
                  variant={
                    run.status === "completed"
                      ? "success"
                      : run.status === "running"
                        ? "warning"
                        : run.status === "failed"
                          ? "danger"
                          : "neutral"
                  }
                >
                  {run.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
        {!isStreaming && runs.length === 0 && (
          <p className="text-sm text-muted-foreground">Click "Start Stream" to monitor live runs</p>
        )}
      </CardContent>
    </Card>
  )
}
