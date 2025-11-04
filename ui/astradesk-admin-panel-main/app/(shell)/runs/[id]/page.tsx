import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Badge } from "@/components/primitives/badge"
import { apiFetch } from "@/lib/api"
import { formatCurrency, formatLatency } from "@/lib/format"
import type { Run } from "@/openapi/openapi-types"
import Link from "next/link"

async function getRun(id: string) {
  try {
    return await apiFetch<Run>(`/runs/${id}`)
  } catch (error) {
    console.error("[v0] Failed to fetch run:", error)
    return null
  }
}

export default async function RunDetailPage({ params }: { params: { id: string } }) {
  const run = await getRun(params.id)

  if (!run) {
    return (
      <>
        <Topbar title="Run Not Found" breadcrumbs={[{ label: "Runs", href: "/runs" }]} />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Unable to load run details.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="Run Details" breadcrumbs={[{ label: "Runs", href: "/runs" }, { label: run.id }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Run Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Run ID</p>
                  <p className="text-sm font-mono">{run.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agent</p>
                  <Link href={`/agents/${run.agent_id}`} className="text-sm text-primary hover:underline">
                    {run.agent_id}
                  </Link>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
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
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Latency</p>
                  <p className="text-sm">{formatLatency(run.latency_ms)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cost</p>
                  <p className="text-sm">{formatCurrency(run.cost_usd)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
