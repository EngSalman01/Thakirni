import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import type { SupabaseClient } from "@supabase/supabase-js"

async function updateStreak(userId: string, habitId: string, supabase: SupabaseClient) {
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
    } else break
  }

  await supabase.from("habits").update({ current_streak: streak, updated_at: new Date().toISOString() }).eq("id", habitId).eq("user_id", userId)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params
  const today = new Date().toISOString().split("T")[0]

  const { data: existing } = await auth.supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", id)
    .eq("user_id", auth.userId)
    .eq("log_date", today)
    .single()

  if (existing) return Response.json({ success: true, message: "Already completed today", alreadyDone: true })

  const { error: logError } = await auth.supabase
    .from("habit_logs")
    .insert({ habit_id: id, user_id: auth.userId, log_date: today, completed_at: new Date().toISOString() })

  if (logError) return Response.json({ error: logError.message }, { status: 500 })

  await updateStreak(auth.userId, id, auth.supabase)
  return Response.json({ success: true, message: "Habit completed! 🔥" })
}
