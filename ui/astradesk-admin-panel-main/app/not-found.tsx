import Link from "next/link"
import { Button } from "@/components/primitives/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <Link href="/">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  )
}
