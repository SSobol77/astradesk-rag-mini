"use client"

import { useState } from "react"
import { Button } from "@/components/primitives/button"
import { apiFetch } from "@/lib/api"
import type { Job, JobTrigger } from "@/openapi/openapi-types"
import { useRouter } from "next/navigation"

interface JobActionsProps {
  job: Job
}

export function JobActions({ job }: JobActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleTrigger = async () => {
    setLoading("trigger")
    try {
      const result = await apiFetch<JobTrigger>(`/jobs/${job.id}:trigger`, { method: "POST" })
      console.log("[v0] Job triggered, run ID:", result.run_id)
      alert(`Job triggered successfully. Run ID: ${result.run_id}`)
      router.refresh()
    } catch (error) {
      console.error("[v0] Trigger failed:", error)
      alert("Job trigger failed")
    } finally {
      setLoading(null)
    }
  }

  const handlePause = async () => {
    setLoading("pause")
    try {
      await apiFetch(`/jobs/${job.id}:pause`, { method: "POST" })
      alert("Job paused successfully")
      router.refresh()
    } catch (error) {
      console.error("[v0] Pause failed:", error)
      alert("Job pause failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleTrigger} disabled={loading !== null}>
        {loading === "trigger" ? "Triggering..." : "Trigger Now"}
      </Button>
      <Button variant="ghost" size="sm" onClick={handlePause} disabled={loading !== null}>
        {loading === "pause" ? "Pausing..." : job.status === "paused" ? "Resume" : "Pause"}
      </Button>
    </div>
  )
}
