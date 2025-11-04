"use client"

import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/primitives/button"
import { DataTable } from "@/components/data/data-table"
import { apiFetch } from "@/lib/api"
import type { Policy } from "@/openapi/openapi-types"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const data = await apiFetch<Policy[]>("/policies")
        setPolicies(data)
      } catch (error) {
        console.error("[v0] Failed to fetch policies:", error)
        setPolicies([])
      } finally {
        setLoading(false)
      }
    }
    fetchPolicies()
  }, [])

  if (loading) {
    return (
      <>
        <Topbar title="Policies" breadcrumbs={[{ label: "Policies" }]} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Loading policies...</div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="Policies" breadcrumbs={[{ label: "Policies" }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage OPA policies for access control</p>
            <Button>Create Policy</Button>
          </div>

          <DataTable
            data={policies}
            columns={[
              {
                key: "name",
                label: "Name",
                render: (policy) => (
                  <Link href={`/policies/${policy.id}`} className="font-medium hover:underline">
                    {policy.name}
                  </Link>
                ),
              },
              {
                key: "id",
                label: "ID",
              },
            ]}
            emptyMessage="No policies found. Create your first policy to get started."
          />
        </div>
      </main>
    </>
  )
}
