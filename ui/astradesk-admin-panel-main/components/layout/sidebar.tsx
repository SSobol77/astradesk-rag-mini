"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: string
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "📊" },
  { label: "Agents", href: "/agents", icon: "🤖" },
  { label: "Intent Graph", href: "/intent-graph", icon: "🕸️" },
  { label: "Flows", href: "/flows", icon: "🔄" },
  { label: "Datasets", href: "/datasets", icon: "📁" },
  { label: "Tools", href: "/tools", icon: "🔧" },
  { label: "Secrets", href: "/secrets", icon: "🔐" },
  { label: "Runs & Logs", href: "/runs", icon: "📝" },
  { label: "Jobs", href: "/jobs", icon: "⏰" },
  { label: "RBAC", href: "/rbac", icon: "👥" },
  { label: "Policies", href: "/policies", icon: "📋" },
  { label: "Audit", href: "/audit", icon: "🔍" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <Image src="/logo.png" alt="AstraDesk Logo" width={32} height={32} className="shrink-0" />
        <h1 className="text-xl font-bold">
          <span className="text-primary">AstraDesk</span>
          <span className="ml-2 text-red-600">Admin</span>
        </h1>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span className="text-lg" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t p-4">
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </div>
    </aside>
  )
}
