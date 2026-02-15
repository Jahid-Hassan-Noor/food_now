"use client"

import * as React from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark" | null>(null)

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("theme")
      if (stored === "dark" || stored === "light") {
        setTheme(stored)
        document.documentElement.classList.toggle("dark", stored === "dark")
        return
      }

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
      document.documentElement.classList.toggle("dark", prefersDark)
    } catch {
      // ignore (SSR safety)
    }
  }, [])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    try {
      document.documentElement.classList.toggle("dark", next === "dark")
      localStorage.setItem("theme", next)
    } catch {
      // ignore
    }
  }

  return (
    <Button
      variant="outline"
      size="icon-md"
      onClick={toggleTheme}
      aria-label="Toggle color scheme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark" ? <Sun className="size-6" /> : <Moon className="size-6" />}
    </Button>
  )
}
