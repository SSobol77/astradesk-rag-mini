"use client"

import { useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className={cn("relative z-10 w-full max-w-lg rounded-xl bg-card p-6 shadow-lg", className)}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>
}

export function ModalTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-xl font-semibold", className)}>{children}</h2>
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-6 flex justify-end gap-3", className)}>{children}</div>
}
