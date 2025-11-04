"use client"

import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/primitives/button"
import { DataTable } from "@/components/data/data-table"
import { apiFetch } from "@/lib/api"
import type { Flow } from "@/openapi/openapi-types"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFlows() {
      try {
        const data = await apiFetch<Flow[]>("/flows")
        setFlows(data)
      } catch (error) {
        console.error("[v0] Failed to fetch flows:", error)
        setFlows([])
      } finally {
        setLoading(false)
      }
    }
    fetchFlows()
  }, [])

  if (loading) {
    return (
      <>
        <Topbar title="Flows" breadcrumbs={[{ label: "Flows" }]} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Loading flows...</div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="Flows" breadcrumbs={[{ label: "Flows" }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage AstraFlow workflows</p>
            <Button>New Flow</Button>
          </div>

          <DataTable
            data={flows}
            columns={[
              {
                key: "name",
                label: "Name",
                render: (flow) => (
                  <Link href={`/flows/${flow.id}`} className="font-medium hover:underline">
                    {flow.name}
                  </Link>
                ),
              },
              {
                key: "id",
                label: "ID",
              },
            ]}
            emptyMessage="No flows found. Create your first flow to get started."
          />
        </div>
      </main>
    </>
  )
}
