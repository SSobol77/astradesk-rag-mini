"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Button } from "@/components/primitives/button"
import { Badge } from "@/components/primitives/badge"
import { JsonViewer } from "@/components/misc/json-viewer"
import { apiFetch } from "@/lib/api"
import type { FlowValidation, FlowDryRun } from "@/openapi/openapi-types"

interface FlowActionsProps {
  flowId: string
  action: "validate" | "dryrun"
}

export function FlowActions({ flowId, action }: FlowActionsProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FlowValidation | FlowDryRun | null>(null)

  const handleAction = async () => {
    setLoading(true)
    try {
      const endpoint = action === "validate" ? `/flows/${flowId}:validate` : `/flows/${flowId}:dryrun`
      const data = await apiFetch<FlowValidation | FlowDryRun>(endpoint, { method: "POST" })
      setResult(data)
    } catch (error) {
      console.error(`[v0] ${action} failed:`, error)
      alert(`Flow ${action} failed`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{action === "validate" ? "Validation" : "Dry Run"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAction} disabled={loading}>
          {loading ? "Running..." : action === "validate" ? "Validate Flow" : "Run Dry Run"}
        </Button>

        {result && (
          <div className="space-y-4">
            {action === "validate" && "valid" in result && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={result.valid ? "success" : "danger"}>{result.valid ? "Valid" : "Invalid"}</Badge>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Errors</p>
                    <div className="space-y-2">
                      {result.errors.map((error, index) => (
                        <div key={index} className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {action === "dryrun" && "steps" in result && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Execution Steps</p>
                <JsonViewer data={result.steps} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
