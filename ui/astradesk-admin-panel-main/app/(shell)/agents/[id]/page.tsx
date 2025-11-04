import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"
import { Badge } from "@/components/primitives/badge"
import { JsonViewer } from "@/components/misc/json-viewer"
import { apiFetch } from "@/lib/api"
import { formatLatency } from "@/lib/format"
import type { Agent, AgentMetrics, AgentIO } from "@/openapi/openapi-types"

async function getAgentDetails(id: string) {
  try {
    const [agent, metrics, io] = await Promise.all([
      apiFetch<Agent>(`/agents/${id}`, { method: "PUT", body: JSON.stringify({}) }).catch(() => null),
      apiFetch<AgentMetrics>(`/agents/${id}/metrics`, { params: { p95: true, p99: false } }),
      apiFetch<AgentIO[]>(`/agents/${id}/io`, { params: { tail: 10 } }),
    ])
    return { agent, metrics, io }
  } catch (error) {
    console.error("[v0] Failed to fetch agent details:", error)
    return null
  }
}

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const data = await getAgentDetails(params.id)

  if (!data) {
    return (
      <>
        <Topbar title="Agent Not Found" breadcrumbs={[{ label: "Agents", href: "/agents" }]} />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Unable to load agent details.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar
        title={data.agent?.name || "Agent Details"}
        breadcrumbs={[{ label: "Agents", href: "/agents" }, { label: data.agent?.name || params.id }]}
      />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="io">Input/Output</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.agent ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">ID</p>
                          <p className="text-sm">{data.agent.id}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Version</p>
                          <p className="text-sm">{data.agent.version}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Environment</p>
                          <Badge variant={data.agent.env === "prod" ? "success" : "neutral"}>{data.agent.env}</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge variant={data.agent.status === "active" ? "success" : "neutral"}>
                            {data.agent.status}
                          </Badge>
                        </div>
                      </div>

                      {data.agent.config && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">Configuration</p>
                          <JsonViewer data={data.agent.config} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No agent data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.metrics?.p95_latency !== undefined ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">P95 Latency</p>
                        <p className="text-2xl font-bold">{formatLatency(data.metrics.p95_latency)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No metrics available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="io">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Input/Output</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.io && data.io.length > 0 ? (
                    <div className="space-y-4">
                      {data.io.map((item, index) => (
                        <div key={index} className="space-y-2 border-b pb-4 last:border-b-0">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Input</p>
                            <div className="rounded-lg bg-muted p-3 text-sm">{item.input}</div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                            <div className="rounded-lg bg-muted p-3 text-sm">{item.output}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No I/O logs available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
