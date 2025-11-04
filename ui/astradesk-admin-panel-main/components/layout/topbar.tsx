"use client"

import { useState } from "react"
import { Button } from "@/components/primitives/button"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { clearAuthToken } from "@/lib/env"

interface TopbarProps {
  title: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

export function Topbar({ title, breadcrumbs }: TopbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = () => {
    clearAuthToken()
    window.location.href = "/"
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6"
      role="banner"
    >
      <div className="flex items-center gap-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-foreground">
                    {crumb.label}
                  </a>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <ThemeSwitcher />

        <Button variant="ghost" size="sm">
          Help
        </Button>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            A
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-popover p-2 shadow-lg">
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  // Profile action
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  handleSignOut()
                }}
                className="w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
