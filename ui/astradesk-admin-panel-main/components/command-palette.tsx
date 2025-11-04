"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { SearchInput } from "./primitives/search-input"

interface CommandItem {
  id: string
  label: string
  description?: string
  href: string
  icon?: string
  keywords?: string[]
}

const COMMANDS: CommandItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: "📊", keywords: ["home", "overview"] },
  { id: "agents", label: "Agents", href: "/agents", icon: "🤖", keywords: ["ai", "bot"] },
  { id: "intent-graph", label: "Intent Graph", href: "/intent-graph", icon: "🕸️", keywords: ["graph", "intent"] },
  { id: "flows", label: "Flows", href: "/flows", icon: "🔄", keywords: ["workflow", "pipeline"] },
  { id: "datasets", label: "Datasets", href: "/datasets", icon: "📁", keywords: ["data", "storage"] },
  { id: "tools", label: "Tools & Connectors", href: "/tools", icon: "🔧", keywords: ["integrations", "plugins"] },
  { id: "secrets", label: "Secrets", href: "/secrets", icon: "🔐", keywords: ["credentials", "keys"] },
  { id: "rbac", label: "RBAC", href: "/rbac", icon: "👥", keywords: ["users", "roles", "permissions"] },
  { id: "policies", label: "Policies", href: "/policies", icon: "📋", keywords: ["opa", "rules"] },
  { id: "audit", label: "Audit Trail", href: "/audit", icon: "📜", keywords: ["logs", "history"] },
  { id: "runs", label: "Runs & Logs", href: "/runs", icon: "📝", keywords: ["execution", "logs"] },
  { id: "jobs", label: "Jobs & Schedules", href: "/jobs", icon: "⏰", keywords: ["cron", "tasks"] },
  { id: "settings", label: "Settings", href: "/settings", icon: "⚙️", keywords: ["config", "preferences"] },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  const filteredCommands = COMMANDS.filter((cmd) => {
    const searchLower = search.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((kw) => kw.includes(searchLower))
    )
  })

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href)
      setOpen(false)
      setSearch("")
      setSelectedIndex(0)
    },
    [router],
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }

      if (!open) return

      if (e.key === "Escape") {
        setOpen(false)
        setSearch("")
        setSelectedIndex(0)
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % filteredCommands.length)
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length)
      }

      if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault()
        handleSelect(filteredCommands[selectedIndex].href)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, filteredCommands, selectedIndex, handleSelect])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-2xl rounded-xl bg-card shadow-2xl border border-border">
        <div className="p-4 border-b border-border">
          <SearchInput
            placeholder="Search pages... (Ctrl+K)"
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            autoFocus
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No results found</div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.href)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors",
                    "hover:bg-accent",
                    index === selectedIndex && "bg-accent",
                  )}
                >
                  <span className="text-2xl">{cmd.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{cmd.label}</div>
                    {cmd.description && <div className="text-xs text-muted-foreground">{cmd.description}</div>}
                  </div>
                  <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">↵</span>
                  </kbd>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted">Esc</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
