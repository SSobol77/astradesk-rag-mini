"use client"

import { useState } from "react"
import { Button } from "@/components/primitives/button"
import { apiFetch } from "@/lib/api"
import type { Secret } from "@/openapi/openapi-types"
import { useRouter } from "next/navigation"

interface SecretActionsProps {
  secret: Secret
}

export function SecretActions({ secret }: SecretActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleRotate = async () => {
    setLoading("rotate")
    try {
      await apiFetch(`/secrets/${secret.id}:rotate`, { method: "POST" })
      alert("Secret rotated successfully")
      router.refresh()
    } catch (error) {
      console.error("[v0] Rotate failed:", error)
      alert("Secret rotation failed")
    } finally {
      setLoading(null)
    }
  }

  const handleDisable = async () => {
    if (!confirm("Are you sure you want to disable this secret?")) return

    setLoading("disable")
    try {
      await apiFetch(`/secrets/${secret.id}:disable`, { method: "POST" })
      alert("Secret disabled successfully")
      router.refresh()
    } catch (error) {
      console.error("[v0] Disable failed:", error)
      alert("Secret disable failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleRotate} disabled={loading !== null}>
        {loading === "rotate" ? "Rotating..." : "Rotate"}
      </Button>
      <Button variant="danger" size="sm" onClick={handleDisable} disabled={loading !== null}>
        {loading === "disable" ? "Disabling..." : "Disable"}
      </Button>
    </div>
  )
}
