import { Topbar } from "@/components/layout/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"
import { apiFetch } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { AuditEntry } from "@/openapi/openapi-types"

async function getAuditEntry(id: string) {
  try {
    return await apiFetch<AuditEntry>(`/audit/${id}`)
  } catch (error) {
    console.error("[v0] Failed to fetch audit entry:", error)
    return null
  }
}

export default async function AuditDetailPage({ params }: { params: { id: string } }) {
  const entry = await getAuditEntry(params.id)

  if (!entry) {
    return (
      <>
        <Topbar title="Audit Entry Not Found" breadcrumbs={[{ label: "Audit", href: "/audit" }]} />
        <main className="flex-1 p-6">
          <p className="text-muted-foreground">Unable to load audit entry.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="Audit Entry" breadcrumbs={[{ label: "Audit", href: "/audit" }, { label: entry.id }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Audit Entry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-sm font-mono">{entry.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm">{formatDate(entry.when_ts)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="text-sm">{entry.user_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <p className="text-sm">{entry.action}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resource</p>
                  <p className="text-sm">{entry.resource}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Signature</p>
                  <p className="text-sm font-mono break-all">{entry.signature}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
