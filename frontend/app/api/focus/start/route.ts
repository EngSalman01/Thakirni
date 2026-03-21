import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await req.json() as {
    plan_id?: string; session_type?: "pomodoro" | "short_break" | "long_break" | "deep_work"; duration_minutes?: number; goal?: string
  }

  const duration = body.duration_minutes ?? (body.session_type === "pomodoro" ? 25 : body.session_type === "short_break" ? 5 : body.session_type === "long_break" ? 15 : 50)

  const { data, error } = await auth.supabase
    .from("focus_sessions")
    .insert({
      user_id: auth.userId,
      plan_id: body.plan_id ?? null,
      session_type: body.session_type ?? "pomodoro",
      duration_minutes: duration,
      goal: body.goal ?? null,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, session: data })
}
