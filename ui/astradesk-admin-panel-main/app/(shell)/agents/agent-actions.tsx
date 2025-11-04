"use client"

import { useState } from "react"
import { Button } from "@/components/primitives/button"
import { apiFetch } from "@/lib/api"
import type { Agent } from "@/openapi/openapi-types"
import { useRouter } from "next/navigation"

interface AgentActionsProps {
  agent: Agent
}

export function AgentActions({ agent }: AgentActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleTest = async () => {
    setLoading("test")
    try {
      const result = await apiFetch(`/agents/${agent.id}:test`, { method: "POST" })
      console.log("[v0] Test result:", result)
      alert("Agent test completed successfully")
      router.refresh()
    } catch (error) {
      console.error("[v0] Test failed:", error)
      alert("Agent test failed")
    } finally {
      setLoading(null)
    }
  }

  const handleClone = async () => {
    setLoading("clone")
    try {
      await apiFetch(`/agents/${agent.id}:clone`, { method: "POST" })
      alert("Agent cloned successfully")
      router.refresh()
    } catch (error) {
      console.error("[v0] Clone failed:", error)
      alert("Agent clone failed")
    } finally {
      setLoading(null)
    }
  }

  const handlePromote = async () => {
    setLoading("promote")
    try {
      await apiFetch(`/agents/${agent.id}:promote`, { method: "POST" })
      alert("Agent promoted successfully")
      router.refresh()
    } catch (error) {
      console.error("[v0] Promote failed:", error)
      alert("Agent promotion failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleTest} disabled={loading !== null}>
        {loading === "test" ? "Testing..." : "Test"}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleClone} disabled={loading !== null}>
        {loading === "clone" ? "Cloning..." : "Clone"}
      </Button>
      <Button variant="ghost" size="sm" onClick={handlePromote} disabled={loading !== null}>
        {loading === "promote" ? "Promoting..." : "Promote"}
      </Button>
    </div>
  )
}
