// Environment variable validation

export const env = {
  API_BASE_URL: (() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/admin/v1"
    // Validate URL format
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      console.warn("[v0] Invalid API_BASE_URL format:", url, "- Using default")
      return "http://localhost:8080/api/admin/v1"
    }
    return url
  })(),
  MOCK_API: (() => {
    const mockEnv = process.env.NEXT_PUBLIC_MOCK_API
    const isMock = mockEnv === "true" || mockEnv === "1" || mockEnv === "yes"
    if (isMock) {
      console.log("[v0] Mock API mode enabled")
    }
    return isMock
  })(),
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("astradesk_token")
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("astradesk_token", token)
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("astradesk_token")
}
