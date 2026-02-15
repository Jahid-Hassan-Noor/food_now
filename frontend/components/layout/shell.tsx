"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import WarningModal from "@/components/modals/warning-modal"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  canAccessRole,
  defaultRouteForRole,
  ensureValidSession,
  getRequiredRole,
  isPublicPath,
  type AuthSession,
} from "@/lib/auth"

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = React.useState<AuthSession | null>(null)
  const [isChecking, setIsChecking] = React.useState(true)
  const [isUnauthorized, setIsUnauthorized] = React.useState(false)
  const [showUnauthorizedModal, setShowUnauthorizedModal] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true

    const validateRoute = async () => {
      if (isPublicPath(pathname)) {
        if (!isMounted) return
        setIsChecking(false)
        setSession(null)
        setIsUnauthorized(false)
        return
      }

      setIsChecking(true)
      const nextSession = await ensureValidSession()

      if (!isMounted) return

      if (!nextSession) {
        setSession(null)
        setIsChecking(false)
        setIsUnauthorized(false)
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }

      const requiredRole = getRequiredRole(pathname)
      const blocked =
        requiredRole !== null && !canAccessRole(nextSession.role, requiredRole)

      setSession(nextSession)
      setIsUnauthorized(blocked)
      setShowUnauthorizedModal(blocked)
      setIsChecking(false)
    }

    validateRoute()
    return () => {
      isMounted = false
    }
  }, [pathname, router])

  if (isPublicPath(pathname)) return <>{children}</>

  if (isChecking || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isUnauthorized) {
    return (
      <WarningModal
        open={showUnauthorizedModal}
        onOpenChange={setShowUnauthorizedModal}
        title="Access restricted"
        message="Your account role does not allow access to this page."
        actionLabel="Go to my dashboard"
        onAction={() => {
          setIsUnauthorized(false)
          router.replace(defaultRouteForRole(session.role))
        }}
      />
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar role={session.role} user={session.user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

export default Shell
