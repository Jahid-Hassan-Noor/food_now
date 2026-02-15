import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function AuthCornerHeader() {
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-1 py-1">
      <Link href="/" className="flex items-center gap-3 pr-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl font-medium text-slate-900 dark:bg-slate-900 dark:text-white">
          FN
        </div>
        <div>
          <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Food Now
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 sm:text-sm">
            Student Kitchen Network
          </p>
        </div>
      </Link>
      <ThemeToggle />
    </div>
  )
}

export default AuthCornerHeader
