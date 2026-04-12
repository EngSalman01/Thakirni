"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"

export function ThemeSync() {
  const { setTheme } = useTheme()

  useEffect(() => {
    // If the user already has a theme in localStorage (set on this device),
    // do NOT overwrite it — that causes flicker when the async Supabase fetch
    // completes after the user has already toggled.
    // Only sync from Supabase on a fresh device / fresh browser with no local preference.
    const stored = localStorage.getItem("theme")
    if (stored && stored !== "system") return

    async function syncTheme() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("profiles")
          .select("preferred_theme")
          .eq("id", user.id)
          .single()

        if (data?.preferred_theme && data.preferred_theme !== "system") {
          setTheme(data.preferred_theme)
        }
      } catch {
        // Ignore
      }
    }
    syncTheme()
  }, [setTheme])

  return null
}
