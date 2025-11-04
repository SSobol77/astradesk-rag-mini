"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Button } from "@/components/primitives/button"
import { Badge } from "@/components/primitives/badge"
import { apiFetch } from "@/lib/api"
import type { PolicySimulation } from "@/openapi/openapi-types"

interface PolicySimulatorProps {
  policyId: string
}

export function PolicySimulator({ policyId }: PolicySimulatorProps) {
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("{}")
  const [result, setResult] = useState<PolicySimulation | null>(null)

  const handleSimulate = async () => {
    setLoading(true)
    try {
      const inputObj = JSON.parse(input)
      const data = await apiFetch<PolicySimulation>(`/policies/${policyId}:simulate`, {
        method: "POST",
        body: JSON.stringify({ input: inputObj }),
      })
      setResult(data)
    } catch (error) {
      console.error("[v0] Simulation failed:", error)
      alert("Policy simulation failed. Check your input JSON.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-2">Input (JSON)</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono min-h-32"
            placeholder='{"user": "alice", "action": "read"}'
          />
        </div>

        <Button onClick={handleSimulate} disabled={loading}>
          {loading ? "Simulating..." : "Simulate Policy"}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Decision:</span>
              <Badge variant={result.allow ? "success" : "danger"}>{result.allow ? "Allow" : "Deny"}</Badge>
            </div>

            {result.violations && result.violations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Violations</p>
                <div className="space-y-2">
                  {result.violations.map((violation, index) => (
                    <div key={index} className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      {violation}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
