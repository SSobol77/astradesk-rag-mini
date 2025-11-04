"use client"

import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/primitives/button"

export function RunFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams()

    const agent = formData.get("agent") as string
    const intent = formData.get("intent") as string
    const status = formData.get("status") as string
    const from = formData.get("from") as string
    const to = formData.get("to") as string

    if (agent) params.set("agent", agent)
    if (intent) params.set("intent", intent)
    if (status) params.set("status", status)
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    router.push(`/runs?${params.toString()}`)
  }

  const handleClear = () => {
    router.push("/runs")
  }

  return (
    <form onSubmit={handleFilter} className="rounded-lg border bg-card p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          type="text"
          name="agent"
          placeholder="Agent ID"
          defaultValue={searchParams.get("agent") || ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="intent"
          placeholder="Intent"
          defaultValue={searchParams.get("intent") || ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={searchParams.get("status") || ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <input
          type="datetime-local"
          name="from"
          placeholder="From"
          defaultValue={searchParams.get("from") || ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <input
          type="datetime-local"
          name="to"
          placeholder="To"
          defaultValue={searchParams.get("to") || ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2 mt-4">
        <Button type="submit" size="sm">
          Apply Filters
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
      </div>
    </form>
  )
}
