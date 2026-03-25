import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("memories")
    .select("content, tags, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = ["Content", "Tags", "Created"]
  const rows = (data ?? []).map(m => [
    `"${(m.content ?? "").replace(/"/g, '""')}"`,
    `"${(m.tags ?? []).join(", ")}"`,
    m.created_at ? new Date(m.created_at).toISOString().slice(0, 10) : "",
  ].join(","))

  const csv = [headers.join(","), ...rows].join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="thakirni-memories-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
