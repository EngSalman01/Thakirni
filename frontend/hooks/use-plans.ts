"use client"

import { useState, useEffect, useCallback } from "react"
import type { Plan } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

export type PlanWithSource = Plan & { _source?: "gcal"; _calendarColor?: string }

interface UsePlansReturn {
  plans: PlanWithSource[]
  isLoading: boolean
  error: Error | null
  addPlan: (plan: Omit<Plan, "id" | "created_at" | "updated_at" | "user_id">) => Promise<void>
  updatePlanStatus: (id: string, status: Plan["status"]) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  refetch: () => Promise<void>
  stats: {
    pendingTasks: number
    pendingGroceries: number
    todayReminders: number
    upcomingMeetings: number
  }
  nextUp: PlanWithSource[]
}

export function usePlans(): UsePlansReturn {
  const [plans, setPlans] = useState<PlanWithSource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchPlans = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setPlans([]); return }

      // Fetch Thakirni plans + Google Calendar events in parallel
      const [plansResult, gcalResult] = await Promise.allSettled([
        supabase
          .from("plans")
          .select("*")
          .eq("user_id", user.id)
          .order("plan_date", { ascending: false })
          .order("created_at", { ascending: false }),

        fetch("/api/google-calendar/events"),
      ])

      if (plansResult.status === "rejected") throw plansResult.reason
      if (plansResult.value.error) throw plansResult.value.error

      const thakirniPlans: PlanWithSource[] = (plansResult.value.data as Plan[]) ?? []

      // Merge Google Calendar events for today (and upcoming 7 days)
      let gcalPlans: PlanWithSource[] = []
      if (gcalResult.status === "fulfilled" && gcalResult.value.ok) {
        try {
          const gcalData = await gcalResult.value.json() as {
            connected: boolean
            events: Array<{
              id: string
              summary?: string
              start?: { dateTime?: string; date?: string }
              created?: string
              updated?: string
              _calendarColor?: string
            }>
          }

          if (gcalData.connected && gcalData.events?.length) {
            const todaySaudi = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })
            const in7Days = new Date(Date.now() + 7 * 86_400_000)
              .toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

            // Build a dedup set from existing Thakirni plans
            const existingKeys = new Set(
              thakirniPlans.map(p => `${(p.title ?? "").toLowerCase().trim()}_${p.plan_date ?? ""}`)
            )

            gcalPlans = gcalData.events
              .filter(ev => {
                const dateStr = ev.start?.dateTime?.slice(0, 10) ?? ev.start?.date ?? ""
                return dateStr >= todaySaudi && dateStr <= in7Days
              })
              .map(ev => {
                const dateTimeStr = ev.start?.dateTime
                const dateStr = dateTimeStr?.slice(0, 10) ?? ev.start?.date ?? ""
                let timeStr: string | null = null
                if (dateTimeStr) {
                  // Convert to Riyadh local time (UTC+3)
                  const d = new Date(dateTimeStr)
                  const h = String(d.toLocaleString("en-GB", { timeZone: "Asia/Riyadh", hour: "2-digit", hour12: false })).padStart(2, "0")
                  const m = String(d.getMinutes()).padStart(2, "0")
                  timeStr = `${h}:${m}:00`
                }
                return {
                  id: `gcal_${ev.id}`,
                  user_id: user.id,
                  title: ev.summary ?? "(No title)",
                  plan_date: dateStr,
                  plan_time: timeStr,
                  end_time: null,
                  category: "meeting" as const,
                  status: "pending" as const,
                  priority: "medium" as const,
                  created_at: ev.created ?? new Date().toISOString(),
                  updated_at: ev.updated ?? new Date().toISOString(),
                  _source: "gcal" as const,
                  _calendarColor: ev._calendarColor,
                }
              })
              .filter(ev => !existingKeys.has(`${ev.title.toLowerCase().trim()}_${ev.plan_date ?? ""}`))
          }
        } catch {
          // GCal failure is non-fatal — just show Thakirni plans
        }
      }

      setPlans([...thakirniPlans, ...gcalPlans])
    } catch (err) {
      console.error("Error fetching plans:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch plans"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addPlan = async (plan: Omit<Plan, "id" | "created_at" | "updated_at" | "user_id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("plans")
        .insert({ ...plan, user_id: user.id })
        .select()
        .single()

      if (error) throw error

      setPlans(prev => [...prev, data as Plan])

      // Auto-push to Google Calendar if enabled (fire-and-forget)
      const { data: profile } = await supabase
        .from("profiles")
        .select("gcal_auto_sync, google_calendar_token")
        .eq("id", user.id)
        .single()

      if (profile?.gcal_auto_sync && profile?.google_calendar_token) {
        fetch("/api/google-calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: plan.title, date: plan.plan_date ?? undefined }),
        }).catch(() => {})
      }
    } catch (err) {
      console.error("Error adding plan:", err)
      throw err instanceof Error ? err : new Error("Failed to add plan")
    }
  }

  const updatePlanStatus = async (id: string, status: Plan["status"]) => {
    // GCal events are read-only — skip silently
    if (id.startsWith("gcal_")) return

    try {
      const { error } = await supabase.from("plans").update({ status }).eq("id", id)
      if (error) throw error
      setPlans(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    } catch (err) {
      console.error("Error updating plan:", err)
      throw err instanceof Error ? err : new Error("Failed to update plan")
    }
  }

  const deletePlan = async (id: string) => {
    if (id.startsWith("gcal_")) return

    try {
      const { error } = await supabase.from("plans").delete().eq("id", id)
      if (error) throw error
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error("Error deleting plan:", err)
      throw err instanceof Error ? err : new Error("Failed to delete plan")
    }
  }

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

  const stats = {
    pendingTasks: plans.filter(p => p.category === "task" && p.status === "pending").length,
    pendingGroceries: plans.filter(p => p.category === "grocery" && p.status === "pending").length,
    upcomingMeetings: plans.filter(p => p.category === "meeting" && p.status === "pending").length,
    todayReminders: plans.filter(p => p.plan_date === today).length,
  }

  const nextUp = plans
    .filter(p => p.status === "pending" && p.plan_date && p.plan_date >= today)
    .sort((a, b) => {
      const dateA = a.plan_date ?? ""
      const dateB = b.plan_date ?? ""
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (a.plan_time ?? "").localeCompare(b.plan_time ?? "")
    })
    .slice(0, 3)

  return { plans, isLoading, error, addPlan, updatePlanStatus, deletePlan, refetch: fetchPlans, stats, nextUp }
}
