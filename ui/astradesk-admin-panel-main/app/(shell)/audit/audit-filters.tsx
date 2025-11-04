"use client"

import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/primitives/button"

export function AuditFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams()

    const user = formData.get("user") as string
    const action = formData.get("action") as string
    const resource = formData.get("resource") as string
    const from = formData.get("from") as string
    const to = formData.get("to") as string

    if (user) params.set("user", user)
    if (action) params.set("action", action)
    if (resource) params.set("resource", resource)
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    router.push(`/audit?${params.toString()}`)
  }

  const handleClear = () => {
    router.push("/audit")
  }

  return (
    <form onSubmit={handleFilter} className="rounded-lg border bg-card p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <input
          type="text"
          name="user"
          placeholder="User ID"
          defaultValue={searchParams.get("user") || ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="action"
          placeholder="Action"
          defaultValue={searchParams.get("action") || ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <input
          type="text"
          name="resource"
          placeholder="Resource"
          defaultValue={searchParams.get("resource") || ""}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
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
