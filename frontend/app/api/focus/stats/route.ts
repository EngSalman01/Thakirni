import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "7")
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await auth.supabase
    .from("focus_sessions")
    .select("duration_minutes, actual_minutes, status, session_type, started_at")
    .eq("status", "completed")
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const sessions = data ?? []
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.actual_minutes ?? s.duration_minutes), 0)
  const totalSessions = sessions.length
  const avgMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

  return Response.json({ stats: { totalMinutes, totalSessions, avgMinutes, days }, sessions })
}
