import { createRouter } from "../lib/types.js"
import { Hono } from "hono"
import { requireAuth } from "../middleware/auth.js"
import { getUserSupabase, getServiceSupabase } from "../lib/supabase.js"

export const habitsRouter = createRouter()
habitsRouter.use("*", requireAuth)

/** POST /api/habits — create a habit */
habitsRouter.post("/", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const body = await c.req.json() as {
    name: string
    description?: string
    icon?: string
    color?: string
    frequency: "daily" | "weekly" | "custom"
    frequency_days?: number[]  // 0=Sun, 1=Mon, etc.
    reminder_time?: string
    category?: string
  }

  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: userId,
      name: body.name,
      description: body.description ?? null,
      icon: body.icon ?? "✅",
      color: body.color ?? "#2552ca",
      frequency: body.frequency,
      frequency_days: body.frequency_days ?? [],
      reminder_time: body.reminder_time ?? null,
      category: body.category ?? "general",
      current_streak: 0,
      longest_streak: 0,
      is_active: true,
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, habit: data })
})

/** GET /api/habits — list all habits with today's completion status */
habitsRouter.get("/", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const today = new Date().toISOString().split("T")[0]

  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at")

  if (error) return c.json({ error: error.message }, 500)

  // Get today's logs
  const { data: logs } = await supabase
    .from("habit_logs")
    .select("habit_id, completed_at")
    .eq("user_id", userId)
    .eq("log_date", today)

  const completedToday = new Set((logs ?? []).map((l) => l.habit_id))

  const habitsWithStatus = (habits ?? []).map((h) => ({
    ...h,
    completed_today: completedToday.has(h.id),
  }))

  return c.json({ habits: habitsWithStatus, date: today })
})

/** POST /api/habits/:id/complete — log a habit completion */
habitsRouter.post("/:id/complete", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()
  const today = new Date().toISOString().split("T")[0]

  // Check if already completed today
  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", id)
    .eq("user_id", userId)
    .eq("log_date", today)
    .single()

  if (existing) {
    return c.json({ success: true, message: "Already completed today", alreadyDone: true })
  }

  // Insert log
  const { error: logError } = await supabase
    .from("habit_logs")
    .insert({ habit_id: id, user_id: userId, log_date: today, completed_at: new Date().toISOString() })

  if (logError) return c.json({ error: logError.message }, 500)

  // Recalculate streak
  await updateStreak(userId, id, supabase)

  return c.json({ success: true, message: "Habit completed! 🔥" })
})

/** POST /api/habits/:id/uncomplete — undo today's completion */
habitsRouter.post("/:id/uncomplete", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()
  const today = new Date().toISOString().split("T")[0]

  await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", id)
    .eq("user_id", userId)
    .eq("log_date", today)

  await updateStreak(userId, id, supabase)
  return c.json({ success: true })
})

/** GET /api/habits/:id/history — get completion history */
habitsRouter.get("/:id/history", async (c) => {
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()
  const days = parseInt(c.req.query("days") ?? "30")

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from("habit_logs")
    .select("log_date, completed_at")
    .eq("habit_id", id)
    .gte("log_date", since.toISOString().split("T")[0])
    .order("log_date", { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ logs: data ?? [] })
})

/** DELETE /api/habits/:id */
habitsRouter.delete("/:id", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()

  await supabase.from("habits").update({ is_active: false }).eq("id", id).eq("user_id", userId)
  return c.json({ success: true })
})

// Helper: recalculate current streak
async function updateStreak(
  userId: string,
  habitId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<void> {
  const { data: logs } = await supabase
    .from("habit_logs")
    .select("log_date")
    .eq("habit_id", habitId)
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(365)

  const dates = (logs ?? []).map((l: { log_date: string }) => l.log_date).sort().reverse()

  let streak = 0
  const today = new Date().toISOString().split("T")[0]
  let current = today

  for (const date of dates) {
    if (date === current) {
      streak++
      const d = new Date(current)
      d.setDate(d.getDate() - 1)
      current = d.toISOString().split("T")[0]
    } else {
      break
    }
  }

  await supabase
    .from("habits")
    .update({ current_streak: streak, updated_at: new Date().toISOString() })
    .eq("id", habitId)
    .eq("user_id", userId)
}
