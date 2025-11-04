import { Topbar } from "@/components/layout/topbar"
import { Badge } from "@/components/primitives/badge"
import { DataTable } from "@/components/data/data-table"
import { apiFetch } from "@/lib/api"
import { formatCurrency, formatLatency } from "@/lib/format"
import type { Run } from "@/openapi/openapi-types"
import Link from "next/link"
import { RunFilters } from "./run-filters"
import { RunsStream } from "./runs-stream"

export const dynamic = "force-dynamic"

async function getRuns(searchParams: Record<string, string | undefined>) {
  try {
    return await apiFetch<Run[]>("/runs", { params: searchParams })
  } catch (error) {
    console.error("[v0] Failed to fetch runs:", error)
    return []
  }
}

export default async function RunsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const runs = await getRuns(searchParams)

  return (
    <>
      <Topbar title="Runs & Logs" breadcrumbs={[{ label: "Runs" }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Monitor agent execution runs and logs</p>
          </div>

          <RunsStream />

          <RunFilters />

          <DataTable
            data={runs}
            columns={[
              {
                key: "id",
                label: "Run ID",
                render: (run) => (
                  <Link href={`/runs/${run.id}`} className="font-mono text-xs hover:underline">
                    {run.id.substring(0, 8)}...
                  </Link>
                ),
              },
              {
                key: "agent_id",
                label: "Agent",
                render: (run) => (
                  <Link href={`/agents/${run.agent_id}`} className="text-primary hover:underline text-sm">
                    {run.agent_id}
                  </Link>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (run) => (
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
                ),
              },
              {
                key: "latency_ms",
                label: "Latency",
                render: (run) => formatLatency(run.latency_ms),
              },
              {
                key: "cost_usd",
                label: "Cost",
                render: (run) => formatCurrency(run.cost_usd),
              },
            ]}
            emptyMessage="No runs found."
          />
        </div>
      </main>
    </>
  )
}
