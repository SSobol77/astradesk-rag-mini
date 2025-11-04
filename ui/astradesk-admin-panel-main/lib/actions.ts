"use server"

import { revalidatePath } from "next/cache"
import { apiFetch, ApiError } from "./api"
import type { Agent, Flow, Dataset, Secret } from "@/openapi/openapi-types"

// Agent actions
export async function createAgent(formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      model: formData.get("model") as string,
      system_prompt: formData.get("system_prompt") as string,
      temperature: Number.parseFloat(formData.get("temperature") as string),
      max_tokens: Number.parseInt(formData.get("max_tokens") as string),
    }

    const agent = await apiFetch<Agent>("/agents", {
      method: "POST",
      body: JSON.stringify(data),
    })

    revalidatePath("/agents")
    return { success: true, data: agent }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to create agent" }
  }
}

export async function updateAgent(id: string, formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      model: formData.get("model") as string,
      system_prompt: formData.get("system_prompt") as string,
      temperature: Number.parseFloat(formData.get("temperature") as string),
      max_tokens: Number.parseInt(formData.get("max_tokens") as string),
    }

    const agent = await apiFetch<Agent>(`/agents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })

    revalidatePath("/agents")
    revalidatePath(`/agents/${id}`)
    return { success: true, data: agent }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to update agent" }
  }
}

export async function deleteAgent(id: string) {
  try {
    await apiFetch(`/agents/${id}`, {
      method: "DELETE",
    })

    revalidatePath("/agents")
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to delete agent" }
  }
}

export async function testAgent(id: string, input: string) {
  try {
    const result = await apiFetch<{ output: string }>(`/agents/${id}/test`, {
      method: "POST",
      body: JSON.stringify({ input }),
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to test agent" }
  }
}

// Flow actions
export async function createFlow(formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      definition: JSON.parse(formData.get("definition") as string),
    }

    const flow = await apiFetch<Flow>("/flows", {
      method: "POST",
      body: JSON.stringify(data),
    })

    revalidatePath("/flows")
    return { success: true, data: flow }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to create flow" }
  }
}

export async function validateFlow(id: string) {
  try {
    const result = await apiFetch<{ valid: boolean; errors?: string[] }>(`/flows/${id}/validate`, {
      method: "POST",
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to validate flow" }
  }
}

// Dataset actions
export async function createDataset(formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as string,
      schema: JSON.parse(formData.get("schema") as string),
    }

    const dataset = await apiFetch<Dataset>("/datasets", {
      method: "POST",
      body: JSON.stringify(data),
    })

    revalidatePath("/datasets")
    return { success: true, data: dataset }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to create dataset" }
  }
}

export async function reindexDataset(id: string) {
  try {
    await apiFetch(`/datasets/${id}/reindex`, {
      method: "POST",
    })

    revalidatePath(`/datasets/${id}`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to reindex dataset" }
  }
}

// Secret actions
export async function createSecret(formData: FormData) {
  try {
    const data = {
      name: formData.get("name") as string,
      value: formData.get("value") as string,
      description: formData.get("description") as string,
    }

    const secret = await apiFetch<Secret>("/secrets", {
      method: "POST",
      body: JSON.stringify(data),
    })

    revalidatePath("/secrets")
    return { success: true, data: secret }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to create secret" }
  }
}

export async function rotateSecret(id: string) {
  try {
    await apiFetch(`/secrets/${id}/rotate`, {
      method: "POST",
    })

    revalidatePath("/secrets")
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to rotate secret" }
  }
}

// RBAC actions
export async function updateUserRole(userId: string, roleId: string) {
  try {
    await apiFetch(`/rbac/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role_id: roleId }),
    })

    revalidatePath("/rbac")
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to update user role" }
  }
}

export async function resetUserMFA(userId: string) {
  try {
    await apiFetch(`/rbac/users/${userId}/mfa/reset`, {
      method: "POST",
    })

    revalidatePath("/rbac")
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.detail }
    }
    return { success: false, error: "Failed to reset MFA" }
  }
}
