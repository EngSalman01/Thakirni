import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20")

  const { data, error } = await auth.supabase
    .from("documents")
    .select("id, title, word_count, language, summary, main_topics, reading_time_minutes, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ documents: data ?? [] })
}
