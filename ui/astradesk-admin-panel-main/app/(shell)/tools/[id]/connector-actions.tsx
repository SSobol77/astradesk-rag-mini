"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Button } from "@/components/primitives/button"
import { Badge } from "@/components/primitives/badge"
import { apiFetch } from "@/lib/api"
import type { ConnectorTest, ConnectorProbe } from "@/openapi/openapi-types"
import { formatLatency } from "@/lib/format"

interface ConnectorActionsProps {
  connectorId: string
}

export function ConnectorActions({ connectorId }: ConnectorActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<ConnectorTest | null>(null)
  const [probeResult, setProbeResult] = useState<ConnectorProbe | null>(null)

  const handleTest = async () => {
    setLoading("test")
    try {
      const result = await apiFetch<ConnectorTest>(`/connectors/${connectorId}:test`, { method: "POST" })
      setTestResult(result)
    } catch (error) {
      console.error("[v0] Test failed:", error)
      alert("Connector test failed")
    } finally {
      setLoading(null)
    }
  }

  const handleProbe = async () => {
    setLoading("probe")
    try {
      const result = await apiFetch<ConnectorProbe>(`/connectors/${connectorId}:probe`, { method: "POST" })
      setProbeResult(result)
    } catch (error) {
      console.error("[v0] Probe failed:", error)
      alert("Connector probe failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Connector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTest} disabled={loading !== null}>
            {loading === "test" ? "Testing..." : "Run Test"}
          </Button>

          {testResult && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Result:</span>
              <Badge variant={testResult.success ? "success" : "danger"}>
                {testResult.success ? "Success" : "Failed"}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Probe Connector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleProbe} disabled={loading !== null}>
            {loading === "probe" ? "Probing..." : "Run Probe"}
          </Button>

          {probeResult && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Latency</p>
              <p className="text-2xl font-bold">{formatLatency(probeResult.latency_ms)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
