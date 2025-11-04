"use client"

import { useEffect } from "react"
import { Button } from "@/components/primitives/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Page error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">{error.message || "An unexpected error occurred"}</p>
        {error.digest && <p className="text-xs text-muted-foreground mb-4">Error ID: {error.digest}</p>}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
