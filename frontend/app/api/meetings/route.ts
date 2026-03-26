import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("limit") ?? "20") || 20, 1), 100)
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get("offset") ?? "0") || 0, 0)

  const { data, error } = await auth.supabase
    .from("meetings")
    .select("id, title, duration_seconds, speaker_count, language, summary, key_points, action_items, speakers, transcript, status, created_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ meetings: data ?? [], count: data?.length ?? 0 })
}
