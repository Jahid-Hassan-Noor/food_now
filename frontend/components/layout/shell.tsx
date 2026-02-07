"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show the sidebar on the root (home) path
  const showSidebar = pathname !== "/"

  if (!showSidebar) return <>{children}</>

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

export default Shell
