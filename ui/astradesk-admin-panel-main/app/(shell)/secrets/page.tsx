"use client"

import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/primitives/button"
import { DataTable } from "@/components/data/data-table"
import { apiFetch } from "@/lib/api"
import { formatRelativeTime } from "@/lib/format"
import type { Secret } from "@/openapi/openapi-types"
import { SecretActions } from "./secret-actions"
import { useEffect, useState } from "react"

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<Secret[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSecrets() {
      try {
        const data = await apiFetch<Secret[]>("/secrets")
        setSecrets(data)
      } catch (error) {
        console.error("[v0] Failed to fetch secrets:", error)
        setSecrets([])
      } finally {
        setLoading(false)
      }
    }
    fetchSecrets()
  }, [])

  if (loading) {
    return (
      <>
        <Topbar title="Keys & Secrets" breadcrumbs={[{ label: "Secrets" }]} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Loading secrets...</div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="Keys & Secrets" breadcrumbs={[{ label: "Secrets" }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage API keys and secrets (values are always masked)</p>
            <Button>New Secret</Button>
          </div>

          <DataTable
            data={secrets}
            columns={[
              {
                key: "name",
                label: "Name",
              },
              {
                key: "type",
                label: "Type",
              },
              {
                key: "last_used_at",
                label: "Last Used",
                render: (secret) => (secret.last_used_at ? formatRelativeTime(secret.last_used_at) : "Never"),
              },
              {
                key: "actions",
                label: "Actions",
                render: (secret) => <SecretActions secret={secret} />,
              },
            ]}
            emptyMessage="No secrets found. Create your first secret to get started."
          />
        </div>
      </main>
    </>
  )
}
