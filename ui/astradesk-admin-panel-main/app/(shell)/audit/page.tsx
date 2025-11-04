import { Topbar } from "@/components/layout/topbar"
import { DataTable } from "@/components/data/data-table"
import { apiFetch } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { AuditEntry } from "@/openapi/openapi-types"
import Link from "next/link"
import { AuditFilters } from "./audit-filters"

export const dynamic = "force-dynamic"

async function getAuditEntries(searchParams: Record<string, string | undefined>) {
  try {
    return await apiFetch<AuditEntry[]>("/audit", { params: searchParams })
  } catch (error) {
    console.error("[v0] Failed to fetch audit entries:", error)
    return []
  }
}

export default async function AuditPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const entries = await getAuditEntries(searchParams)

  return (
    <>
      <Topbar title="Audit Trail" breadcrumbs={[{ label: "Audit" }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Immutable audit log of all system actions</p>
          </div>

          <AuditFilters />

          <DataTable
            data={entries}
            columns={[
              {
                key: "when_ts",
                label: "Timestamp",
                render: (entry) => formatDate(entry.when_ts),
              },
              {
                key: "user_id",
                label: "User",
              },
              {
                key: "action",
                label: "Action",
              },
              {
                key: "resource",
                label: "Resource",
              },
              {
                key: "id",
                label: "Details",
                render: (entry) => (
                  <Link href={`/audit/${entry.id}`} className="text-primary hover:underline text-sm">
                    View
                  </Link>
                ),
              },
            ]}
            emptyMessage="No audit entries found."
          />
        </div>
      </main>
    </>
  )
}
