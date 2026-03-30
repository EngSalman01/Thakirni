import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  return profile?.is_admin ? user : null
}

// GET /api/admin/leads?status=new&page=0
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  if (!await assertAdmin(supabase)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? ""
  const page   = parseInt(searchParams.get("page") ?? "0")
  const limit  = 25

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * limit, page * limit + limit - 1)

  if (status) query = query.eq("status", status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: data, total: count })
}

// PATCH /api/admin/leads — update status/notes
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  if (!await assertAdmin(supabase)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: "Lead ID required" }, { status: 400 })

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }
  if (body.status) updates.status = body.status
  if (body.notes  !== undefined) updates.notes = body.notes
  if (body.assigned_to) updates.assigned_to = body.assigned_to

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lead: data })
}

// DELETE /api/admin/leads?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  if (!await assertAdmin(supabase)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const { error } = await supabase.from("leads").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
