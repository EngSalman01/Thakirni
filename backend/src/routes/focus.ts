import { createRouter } from "../lib/types.js"
import { Hono } from "hono"
import { requireAuth } from "../middleware/auth.js"
import { getUserSupabase, getServiceSupabase } from "../lib/supabase.js"

export const focusRouter = createRouter()
focusRouter.use("*", requireAuth)

/** POST /api/focus/start — start a focus/Pomodoro session */
focusRouter.post("/start", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)

  const body = await c.req.json() as {
    plan_id?: string
    session_type?: "pomodoro" | "short_break" | "long_break" | "deep_work"
    duration_minutes?: number
    goal?: string
  }

  const duration = body.duration_minutes ?? (body.session_type === "pomodoro" ? 25 : body.session_type === "short_break" ? 5 : body.session_type === "long_break" ? 15 : 50)

  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: userId,
      plan_id: body.plan_id ?? null,
      session_type: body.session_type ?? "pomodoro",
      duration_minutes: duration,
      goal: body.goal ?? null,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, session: data })
})

/** PATCH /api/focus/:id/complete — complete a session */
focusRouter.patch("/:id/complete", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()
  const body = await c.req.json() as { actual_minutes?: number; notes?: string }

  const { data, error } = await supabase
    .from("focus_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      actual_minutes: body.actual_minutes ?? null,
      notes: body.notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // Log to timeline
  const service = getServiceSupabase()
  service.from("timeline_events").insert({
    user_id: userId,
    title: `Focus session: ${data.duration_minutes} min`,
    event_date: new Date().toISOString().split("T")[0],
    source_type: "focus_completed",
    source_id: id,
    importance: 1,
  }).then(undefined, () => {})

  return c.json({ success: true, session: data })
})

/** PATCH /api/focus/:id/abandon — abandon a session */
focusRouter.patch("/:id/abandon", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()

  const { error } = await supabase
    .from("focus_sessions")
    .update({ status: "abandoned", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

/** GET /api/focus/stats — get focus statistics */
focusRouter.get("/stats", async (c) => {
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const days = parseInt(c.req.query("days") ?? "7")

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("duration_minutes, actual_minutes, status, session_type, started_at")
    .eq("status", "completed")
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false })

  if (error) return c.json({ error: error.message }, 500)

  const sessions = data ?? []
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.actual_minutes ?? s.duration_minutes), 0)
  const totalSessions = sessions.length
  const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

  return c.json({
    stats: {
      totalMinutes,
      totalSessions,
      avgMinutes,
      days,
    },
    sessions,
  })
})

/** GET /api/focus/history */
focusRouter.get("/history", async (c) => {
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const limit = parseInt(c.req.query("limit") ?? "20")

  const { data, error } = await supabase
    .from("focus_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ sessions: data ?? [] })
})
