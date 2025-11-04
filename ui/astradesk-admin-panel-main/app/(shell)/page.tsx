import { Topbar } from "@/components/layout/topbar"
import { KpiCard } from "@/components/charts/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Badge } from "@/components/primitives/badge"
import { Button } from "@/components/primitives/button"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { formatCurrency, formatNumber, formatLatency } from "@/lib/format"
import type { HealthStatus, UsageMetrics } from "@/openapi/openapi-types"

async function getDashboardData() {
  try {
    const [health, usage, errors] = await Promise.all([
      apiFetch<HealthStatus>("/health"),
      apiFetch<UsageMetrics>("/usage/llm"),
      apiFetch<string[]>("/errors/recent", { params: { limit: 10 } }),
    ])
    return { health, usage, errors }
  } catch (error) {
    console.error("[v0] Failed to fetch dashboard data:", error)
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <>
      <Topbar title="Dashboard" />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              title="Total Requests"
              value={data?.usage ? formatNumber(data.usage.total_requests) : "-"}
              description="LLM API calls"
            />
            <KpiCard
              title="LLM Cost"
              value={data?.usage ? formatCurrency(data.usage.cost_usd) : "-"}
              description="Total spend (USD)"
            />
            <KpiCard
              title="P95 Latency"
              value={data?.usage ? formatLatency(data.usage.latency_p95_ms) : "-"}
              description="95th percentile"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.health ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Status</span>
                      <Badge
                        variant={
                          data.health.status === "healthy"
                            ? "success"
                            : data.health.status === "degraded"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {data.health.status}
                      </Badge>
                    </div>

                    {data.health.components && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Components</p>
                        {Object.entries(data.health.components).map(([name, status]) => (
                          <div key={name} className="flex items-center justify-between text-sm">
                            <span>{name}</span>
                            <Badge variant={status === "healthy" ? "success" : "danger"} className="text-xs">
                              {status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unable to load health status</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Errors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Errors</CardTitle>
                <Link href="/runs">
                  <Button variant="ghost" size="sm">
                    View Runs
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {data?.errors && data.errors.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.errors.map((error, index) => (
                      <div key={index} className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent errors</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
