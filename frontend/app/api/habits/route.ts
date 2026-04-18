import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { parseBody, sanitizeString } from "@/lib/validate"

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const today = new Date().toISOString().split("T")[0]

  const { data: habits, error } = await auth.supabase
    .from("habits")
    .select("*")
    .eq("user_id", auth.userId)
    .eq("is_active", true)
    .order("created_at")

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Fetch last 7 days logs for weekly dot tracker
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const weekStart = sevenDaysAgo.toISOString().split("T")[0]

  const { data: weekLogs } = await auth.supabase
    .from("habit_logs")
    .select("habit_id, log_date")
    .eq("user_id", auth.userId)
    .gte("log_date", weekStart)
    .lte("log_date", today)

  // Build a set of "habitId:date" strings for O(1) lookup
  const weekSet = new Set((weekLogs ?? []).map((l) => `${l.habit_id}:${l.log_date}`))

  // Generate the last 7 dates (today and 6 days before)
  const last7Dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7Dates.push(d.toISOString().split("T")[0])
  }

  const completedToday = new Set((weekLogs ?? []).filter(l => l.log_date === today).map((l) => l.habit_id))
  const habitsWithStatus = (habits ?? []).map((h) => ({
    ...h,
    completed_today: completedToday.has(h.id),
    week_done: last7Dates.map((d) => weekSet.has(`${h.id}:${d}`)),
  }))

  return Response.json({ habits: habitsWithStatus, date: today })
}

const VALID_FREQUENCIES = new Set(["daily", "weekly", "custom"])

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const [body, parseErr] = await parseBody<Record<string, unknown>>(req, 32_768)
  if (parseErr) return parseErr

  const name = sanitizeString(body.name, 200)
  if (!name) return Response.json({ error: "name is required" }, { status: 400 })

  const frequency = String(body.frequency ?? "")
  if (!VALID_FREQUENCIES.has(frequency)) {
    return Response.json({ error: "frequency must be daily, weekly, or custom" }, { status: 400 })
  }

  const description = sanitizeString(body.description, 1000) ?? null
  const icon        = sanitizeString(body.icon, 10) ?? "✅"
  const color       = sanitizeString(body.color, 20) ?? "#6366f1"
  const category    = sanitizeString(body.category, 100) ?? "general"
  const reminderTime = sanitizeString(body.reminder_time, 20) ?? null

  const freqDays = Array.isArray(body.frequency_days)
    ? (body.frequency_days as unknown[]).filter((d) => typeof d === "number" && d >= 0 && d <= 6).slice(0, 7)
    : []

  const { data, error } = await auth.supabase
    .from("habits")
    .insert({
      user_id: auth.userId,
      name,
      description,
      icon,
      color,
      frequency,
      frequency_days: freqDays,
      reminder_time: reminderTime,
      category,
      current_streak: 0,
      longest_streak: 0,
      is_active: true,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, habit: data })
}
