import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30")

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await auth.supabase
    .from("habit_logs")
    .select("log_date, completed_at")
    .eq("habit_id", id)
    .gte("log_date", since.toISOString().split("T")[0])
    .order("log_date", { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ logs: data ?? [] })
}
