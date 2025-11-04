import type React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Footer } from "@/components/layout/footer"

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-64">
        {children}
        <Footer />
      </div>
    </div>
  )
}
