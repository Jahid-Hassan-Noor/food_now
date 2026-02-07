"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SearchForm } from "@/components/sidebar/search-form"
import NotificationsButton from "@/components/ui/notifications-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

function titleFromPath(pathname: string | null) {
  if (!pathname || pathname === "/") return "Home"
  // remove trailing slash
  const path = pathname.replace(/\/$/, "")
  const parts = path.split("/").filter(Boolean)
  // If root of a section like /dashboard -> Dashboard
  const last = parts[parts.length - 1]
  // map common names
  const mapping: Record<string, string> = {
    dashboard: "Dashboard",
    settings: "Settings",
    projects: "Projects",
    profile: "Profile",
    notifications: "Notifications",
    chef: "Chef",
  }
  if (mapping[last]) return mapping[last]
  // Convert kebab/camel to Title Case
  const words = last.replace(/[-_]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")
  return words
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function generateBreadcrumbs(pathname: string | null) {
  if (!pathname || pathname === "/") return []
  const path = pathname.replace(/\/$/, "")
  const parts = path.split("/").filter(Boolean)
  
  return parts.map((part, index) => {
    const href = "/" + parts.slice(0, index + 1).join("/")
    const title = titleFromPath(href)
    return { href, title }
  })
}

export function Header() {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)
  const isSingleLevel = breadcrumbs.length === 1

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 justify-between">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-7" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.length === 0 ? (
              <BreadcrumbItem>
                <BreadcrumbPage>Home</BreadcrumbPage>
              </BreadcrumbItem>
            ) : isSingleLevel ? (
              <BreadcrumbItem>
                <BreadcrumbPage>{breadcrumbs[0].title}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && (
                      <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 mr-6">
        <SearchForm />
        <NotificationsButton count={12} />
        <ThemeToggle />
      </div>
    </header>
  )
}

export default Header
