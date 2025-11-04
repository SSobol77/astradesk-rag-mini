import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/primitives/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { apiFetch } from "@/lib/api"
import type { Connector } from "@/openapi/openapi-types"
import Link from "next/link"

async function getConnectors() {
  try {
    return await apiFetch<Connector[]>("/connectors")
  } catch (error) {
    console.error("[v0] Failed to fetch connectors:", error)
    return []
  }
}

export default async function ToolsPage() {
  const connectors = await getConnectors()

  return (
    <>
      <Topbar title="Tools & Connectors" breadcrumbs={[{ label: "Tools" }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage external tool integrations</p>
            <Button>New Connector</Button>
          </div>

          {connectors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectors.map((connector) => (
                <Link key={connector.id} href={`/tools/${connector.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle>{connector.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{connector.type}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No connectors found. Create your first connector to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
