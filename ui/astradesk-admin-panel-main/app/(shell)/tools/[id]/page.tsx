import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { apiFetch } from "@/lib/api"
import type { Connector } from "@/openapi/openapi-types"
import { ConnectorActions } from "./connector-actions"

async function getConnector(id: string) {
  try {
    return await apiFetch<Connector>(`/connectors/${id}`, { method: "GET" }).catch(() => null)
  } catch (error) {
    console.error("[v0] Failed to fetch connector:", error)
    return null
  }
}

export default async function ConnectorDetailPage({ params }: { params: { id: string } }) {
  const connector = await getConnector(params.id)

  if (!connector) {
    return (
      <>
        <Topbar title="Connector Not Found" breadcrumbs={[{ label: "Tools", href: "/tools" }]} />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Unable to load connector details.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title={connector.name} breadcrumbs={[{ label: "Tools", href: "/tools" }, { label: connector.name }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connector Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="text-sm">{connector.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-sm">{connector.type}</p>
              </div>
            </CardContent>
          </Card>

          <ConnectorActions connectorId={params.id} />
        </div>
      </main>
    </>
  )
}
