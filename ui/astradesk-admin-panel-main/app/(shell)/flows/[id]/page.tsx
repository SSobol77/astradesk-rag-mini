import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"
import { JsonViewer } from "@/components/misc/json-viewer"
import { apiFetch } from "@/lib/api"
import type { Flow } from "@/openapi/openapi-types"
import { FlowActions } from "./flow-actions"

async function getFlowDetails(id: string) {
  try {
    const flow = await apiFetch<Flow>(`/flows/${id}`, { method: "GET" }).catch(() => null)
    const log = await apiFetch<string[]>(`/flows/${id}/log`).catch(() => [])
    return { flow, log }
  } catch (error) {
    console.error("[v0] Failed to fetch flow details:", error)
    return null
  }
}

export default async function FlowDetailPage({ params }: { params: { id: string } }) {
  const data = await getFlowDetails(params.id)

  if (!data?.flow) {
    return (
      <>
        <Topbar title="Flow Not Found" breadcrumbs={[{ label: "Flows", href: "/flows" }]} />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Unable to load flow details.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title={data.flow.name} breadcrumbs={[{ label: "Flows", href: "/flows" }, { label: data.flow.name }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Tabs defaultValue="yaml">
            <TabsList>
              <TabsTrigger value="yaml">YAML View</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="dryrun">Dry Run</TabsTrigger>
              <TabsTrigger value="log">Log</TabsTrigger>
            </TabsList>

            <TabsContent value="yaml">
              <Card>
                <CardHeader>
                  <CardTitle>Flow Definition</CardTitle>
                </CardHeader>
                <CardContent>
                  <JsonViewer data={data.flow.graph} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="validation">
              <FlowActions flowId={params.id} action="validate" />
            </TabsContent>

            <TabsContent value="dryrun">
              <FlowActions flowId={params.id} action="dryrun" />
            </TabsContent>

            <TabsContent value="log">
              <Card>
                <CardHeader>
                  <CardTitle>Execution Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.log && data.log.length > 0 ? (
                    <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
                      {data.log.map((line, index) => (
                        <div key={index} className="text-muted-foreground">
                          {line}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No log entries available</p>
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
