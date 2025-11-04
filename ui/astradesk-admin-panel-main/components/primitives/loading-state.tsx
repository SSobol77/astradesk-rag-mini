import { Spinner } from "./spinner"
import { cn } from "@/lib/utils"

export interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message, className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12", className)}>
      <Spinner size="lg" className="text-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
