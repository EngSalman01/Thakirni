import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format") ?? "csv"
  const status = searchParams.get("status") ?? "all"
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  let query = supabase
    .from("plans")
    .select("title, description, plan_date, plan_time, end_time, category, location, priority, status, recurrence, created_at, completed_at")
    .eq("user_id", user.id)
    .order("plan_date", { ascending: false })
    .order("plan_time", { ascending: true, nullsFirst: false })
    .limit(5000)

  if (status !== "all") query = query.eq("status", status)
  if (from) query = query.gte("plan_date", from)
  if (to) query = query.lte("plan_date", to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No plans found" }, { status: 404 })
  }

  if (format === "json") {
    return NextResponse.json(data, {
      headers: { "Content-Disposition": "attachment; filename=\"thakirni-plans.json\"" },
    })
  }

  // CSV
  const headers = ["Title", "Description", "Date", "Time", "End Time", "Category", "Location", "Priority", "Status", "Recurrence", "Created", "Completed"]
  const rows = data.map(p => [
    `"${(p.title ?? "").replace(/"/g, '""')}"`,
    `"${(p.description ?? "").replace(/"/g, '""')}"`,
    p.plan_date ?? "",
    p.plan_time ?? "",
    p.end_time ?? "",
    p.category ?? "",
    `"${(p.location ?? "").replace(/"/g, '""')}"`,
    p.priority ?? "",
    p.status ?? "",
    p.recurrence ?? "",
    p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : "",
    p.completed_at ? new Date(p.completed_at).toISOString().slice(0, 10) : "",
  ].join(","))

  const csv = [headers.join(","), ...rows].join("\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="thakirni-plans-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
