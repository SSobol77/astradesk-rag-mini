// Type-safe API client with Bearer auth, error handling, and mock support

import { env, getAuthToken } from "./env"
import type { ErrorResponse } from "@/openapi/openapi-types"
import {
  mockAgents,
  mockHealth,
  mockUsage,
  mockErrors,
  mockFlows,
  mockDatasets,
  mockConnectors,
  mockSecrets,
  mockUsers,
  mockRoles,
  mockPolicies,
  mockAuditEntries,
  mockRuns,
  mockJobs,
} from "./mock-data"

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail)
    this.name = "ApiError"
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

function getMockData(endpoint: string): any {
  const mockMap: Record<string, any> = {
    "/agents": mockAgents,
    "/health": mockHealth,
    "/usage/llm": mockUsage,
    "/errors/recent": mockErrors,
    "/flows": mockFlows,
    "/datasets": mockDatasets,
    "/tools": mockConnectors,
    "/secrets": mockSecrets,
    "/rbac/users": mockUsers,
    "/rbac/roles": mockRoles,
    "/policies": mockPolicies,
    "/audit": mockAuditEntries,
    "/runs": mockRuns,
    "/jobs": mockJobs,
  }

  // Handle detail endpoints (e.g., /agents/agent-001)
  for (const [key, value] of Object.entries(mockMap)) {
    if (endpoint.startsWith(key + "/") && Array.isArray(value)) {
      const id = endpoint.split("/").pop()
      return value.find((item: any) => item.id === id) || null
    }
  }

  return mockMap[endpoint] || null
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  if (env.MOCK_API) {
    console.log("[v0] Mock API mode: returning mock data for", endpoint)
    await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate network delay
    const mockData = getMockData(endpoint)
    if (mockData === null) {
      console.warn("[v0] No mock data found for endpoint:", endpoint)
      throw new ApiError(404, `Mock endpoint not found: ${endpoint}`)
    }
    return mockData as T
  }

  const { params, ...fetchOptions } = options

  if (!env.API_BASE_URL || env.API_BASE_URL === "") {
    console.error(
      "[v0] API_BASE_URL is not configured. Set NEXT_PUBLIC_API_BASE_URL environment variable or enable mock mode with NEXT_PUBLIC_MOCK_API=true",
    )
    throw new ApiError(500, "API configuration error: Base URL not set. Enable mock mode or configure API URL.")
  }

  if (!env.API_BASE_URL.startsWith("http://") && !env.API_BASE_URL.startsWith("https://")) {
    console.error("[v0] Invalid API_BASE_URL format:", env.API_BASE_URL, "- Must start with http:// or https://")
    throw new ApiError(500, `API configuration error: Invalid base URL format: ${env.API_BASE_URL}`)
  }

  // Build URL with query params
  let url = `${env.API_BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  console.log("[v0] API request:", url)

  // Add auth header
  const token = getAuthToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    // Perform the fetch request
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const errorResponse: ErrorResponse = await response.json()
        throw new ApiError(response.status, errorResponse.detail || "Unknown error")
      } else {
        // HTML or other non-JSON response (likely 404 or server error)
        const text = await response.text()
        console.error("[v0] Non-JSON error response:", text.substring(0, 200))
        throw new ApiError(response.status, `Server error: ${response.statusText}`)
      }
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    console.error("[v0] Network error:", error)
    throw new ApiError(500, `Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
