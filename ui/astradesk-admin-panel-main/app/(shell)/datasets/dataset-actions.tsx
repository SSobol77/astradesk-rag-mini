"use client"

import { useState } from "react"
import { Button } from "@/components/primitives/button"
import { apiFetch } from "@/lib/api"
import type { Dataset, ReindexJob } from "@/openapi/openapi-types"
import { useRouter } from "next/navigation"

interface DatasetActionsProps {
  dataset: Dataset
}

export function DatasetActions({ dataset }: DatasetActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleReindex = async () => {
    setLoading(true)
    try {
      const result = await apiFetch<ReindexJob>(`/datasets/${dataset.id}:reindex`, { method: "POST" })
      console.log("[v0] Reindex job started:", result.job_id)
      alert(`Reindexing started. Job ID: ${result.job_id}`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Reindex failed:", error)
      alert("Reindex failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleReindex} disabled={loading}>
      {loading ? "Reindexing..." : "Reindex"}
    </Button>
  )
}
