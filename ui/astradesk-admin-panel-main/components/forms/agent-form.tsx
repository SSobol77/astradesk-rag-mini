"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/primitives/input"
import { Textarea } from "@/components/primitives/textarea"
import { Select } from "@/components/primitives/select"
import { Button } from "@/components/primitives/button"
import { createAgent, updateAgent } from "@/lib/actions"
import { toast } from "@/hooks/use-toast"
import type { Agent } from "@/openapi/openapi-types"

interface AgentFormProps {
  agent?: Agent
  onSuccess?: () => void
}

export function AgentForm({ agent, onSuccess }: AgentFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = agent ? await updateAgent(agent.id, formData) : await createAgent(formData)

    setLoading(false)

    if (result.success) {
      toast({
        title: agent ? "Agent updated" : "Agent created",
        description: `Successfully ${agent ? "updated" : "created"} agent`,
      })
      onSuccess?.()
      if (!agent) {
        router.push("/agents")
      }
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Input name="name" label="Name" placeholder="My Agent" defaultValue={agent?.name} required />
      <Textarea
        name="description"
        label="Description"
        placeholder="Describe what this agent does..."
        defaultValue={agent?.description}
      />
      <Select
        name="model"
        label="Model"
        defaultValue={agent?.model || "gpt-4"}
        options={[
          { value: "gpt-4", label: "GPT-4" },
          { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
          { value: "claude-3-opus", label: "Claude 3 Opus" },
          { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
        ]}
        required
      />
      <Textarea
        name="system_prompt"
        label="System Prompt"
        placeholder="You are a helpful assistant..."
        defaultValue={agent?.system_prompt}
        required
      />
      <Input
        name="temperature"
        label="Temperature"
        type="number"
        step="0.1"
        min="0"
        max="2"
        defaultValue={agent?.temperature || 0.7}
        helperText="Controls randomness (0-2)"
        required
      />
      <Input
        name="max_tokens"
        label="Max Tokens"
        type="number"
        min="1"
        max="32000"
        defaultValue={agent?.max_tokens || 2000}
        helperText="Maximum response length"
        required
      />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : agent ? "Update Agent" : "Create Agent"}
        </Button>
      </div>
    </form>
  )
}
