"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Ensure hydration match for icons
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-border/60 shadow-sm opacity-50 pointer-events-none">
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-10 w-10 rounded-2xl border-border/80 bg-background hover:bg-muted/80 shadow-md hover:scale-105 active:scale-95 transition-all duration-200 group relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 text-amber-500 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 text-sky-400 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
