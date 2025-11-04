"use client"

import { Topbar } from "@/components/layout/topbar"
import { Button } from "@/components/primitives/button"
import { Badge } from "@/components/primitives/badge"
import { DataTable } from "@/components/data/data-table"
import { apiFetch } from "@/lib/api"
import type { Agent } from "@/openapi/openapi-types"
import Link from "next/link"
import { AgentActions } from "./agent-actions"
import { useEffect, useState } from "react"

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAgents() {
      try {
        const data = await apiFetch<Agent[]>("/agents")
        setAgents(data)
      } catch (error) {
        console.error("[v0] Failed to fetch agents:", error)
        setAgents([])
      } finally {
        setLoading(false)
      }
    }
    fetchAgents()
  }, [])

  if (loading) {
    return (
      <>
        <Topbar title="Agents" breadcrumbs={[{ label: "Agents" }]} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">Loading agents...</div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Topbar title="Agents" breadcrumbs={[{ label: "Agents" }]} />

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage AI agents across environments</p>
            <Button>New Agent</Button>
          </div>

          <DataTable
            data={agents}
            columns={[
              {
                key: "name",
                label: "Name",
                render: (agent) => (
                  <Link href={`/agents/${agent.id}`} className="font-medium hover:underline">
                    {agent.name}
                  </Link>
                ),
              },
              {
                key: "version",
                label: "Version",
              },
              {
                key: "env",
                label: "Environment",
                render: (agent) => (
                  <Badge variant={agent.env === "prod" ? "success" : agent.env === "staging" ? "warning" : "neutral"}>
                    {agent.env}
                  </Badge>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (agent) => (
                  <Badge variant={agent.status === "active" ? "success" : "neutral"}>{agent.status}</Badge>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                render: (agent) => <AgentActions agent={agent} />,
              },
            ]}
            emptyMessage="No agents found. Create your first agent to get started."
          />
        </div>
      </main>
    </>
  )
}
