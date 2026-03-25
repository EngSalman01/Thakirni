"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = React.useCallback(async () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    // Persist to profile (best-effort, non-blocking)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("profiles").update({ preferred_theme: newTheme }).eq("id", user.id)
      }
    } catch {
      // Ignore — localStorage already saved it
    }
  }, [resolvedTheme, setTheme])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <Sun className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={toggleTheme}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5 text-primary" />
      ) : (
        <Moon className="h-5 w-5 text-primary" />
      )}
      <span className="sr-only">تبديل السمة</span>
    </Button>
  )
}
