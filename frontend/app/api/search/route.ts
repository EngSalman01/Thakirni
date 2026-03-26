import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2 || q.length > 100) return NextResponse.json({ results: [] })

  const search = `%${q}%`

  const [memories, plans, habits, goals] = await Promise.all([
    supabase
      .from("memories")
      .select("id, title, content, category, created_at")
      .eq("user_id", user.id)
      .or(`title.ilike.${search},content.ilike.${search}`)
      .limit(5),
    supabase
      .from("plans")
      .select("id, title, plan_date, status, category")
      .eq("user_id", user.id)
      .ilike("title", search)
      .limit(5),
    supabase
      .from("habits")
      .select("id, name, category")
      .eq("user_id", user.id)
      .ilike("name", search)
      .limit(3),
    supabase
      .from("goals")
      .select("id, title, status")
      .eq("user_id", user.id)
      .ilike("title", search)
      .limit(3),
  ])

  const results = [
    ...(memories.data ?? []).map(r => ({ ...r, type: "memory" as const })),
    ...(plans.data ?? []).map(r => ({ ...r, type: "plan" as const })),
    ...(habits.data ?? []).map(r => ({ ...r, type: "habit" as const })),
    ...(goals.data ?? []).map(r => ({ ...r, type: "goal" as const })),
  ]

  return NextResponse.json({ results })
}
