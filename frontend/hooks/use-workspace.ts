"use client"

import { useState, useEffect, useCallback } from "react"

export interface Workspace {
  id: string
  name: string
  type: "personal" | "team"
  owner_id: string
  team_id: string | null
  slug: string | null
  avatar_url: string | null
  member_role: "owner" | "admin" | "member"
  joined_at: string
}

const STORAGE_KEY = "thakirni_active_workspace"

export function useWorkspace() {
  const [workspaces, setWorkspaces]       = useState<Workspace[]>([])
  const [active, setActiveState]          = useState<Workspace | null>(null)
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    let mounted = true
    fetch("/api/workspaces")
      .then(r => r.json())
      .then(data => {
        if (!mounted) return
        const list: Workspace[] = data.workspaces ?? []
        setWorkspaces(list)

        // Restore last active workspace from localStorage
        const stored = typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY)
          : null
        const storedWs = stored ? list.find(w => w.id === stored) : null
        const personal = list.find(w => w.type === "personal")
        setActiveState(storedWs ?? personal ?? list[0] ?? null)
      })
      .catch(() => {
        if (mounted) setWorkspaces([])
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const setActive = useCallback((ws: Workspace) => {
    setActiveState(ws)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, ws.id)
    }
  }, [])

  const personalWorkspace = workspaces.find(w => w.type === "personal") ?? null
  const teamWorkspaces    = workspaces.filter(w => w.type === "team")

  return {
    workspaces,
    active,
    setActive,
    personalWorkspace,
    teamWorkspaces,
    loading,
    refresh: () => {
      setLoading(true)
      fetch("/api/workspaces")
        .then(r => r.json())
        .then(data => setWorkspaces(data.workspaces ?? []))
        .finally(() => setLoading(false))
    },
  }
}
