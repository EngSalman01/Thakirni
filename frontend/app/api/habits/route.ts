import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

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

  const { data: logs } = await auth.supabase
    .from("habit_logs")
    .select("habit_id, completed_at")
    .eq("user_id", auth.userId)
    .eq("log_date", today)

  const completedToday = new Set((logs ?? []).map((l) => l.habit_id))
  const habitsWithStatus = (habits ?? []).map((h) => ({ ...h, completed_today: completedToday.has(h.id) }))

  return Response.json({ habits: habitsWithStatus, date: today })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await req.json() as {
    name: string; description?: string; icon?: string; color?: string;
    frequency: "daily" | "weekly" | "custom"; frequency_days?: number[]; reminder_time?: string; category?: string
  }

  const { data, error } = await auth.supabase
    .from("habits")
    .insert({
      user_id: auth.userId,
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

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, habit: data })
}
