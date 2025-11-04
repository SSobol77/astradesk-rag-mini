import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "danger" | "neutral"
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        {
          "bg-success/10 text-success": variant === "success",
          "bg-warning/10 text-warning": variant === "warning",
          "bg-destructive/10 text-destructive": variant === "danger",
          "bg-muted text-muted-foreground": variant === "neutral",
        },
        className,
      )}
      {...props}
    />
  )
}
