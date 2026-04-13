import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("reminders")
    .select("id, title, remind_at, is_sent, sent_at, channel, repeat_interval_minutes, plan_id")
    .eq("user_id", user.id)
    .order("remind_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminders: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json() as {
    id: string
    title?: string
    remind_at?: string
    repeat_interval_minutes?: number | null
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (body.title !== undefined) patch.title = body.title.trim()
  if (body.remind_at !== undefined) patch.remind_at = body.remind_at
  if (body.repeat_interval_minutes !== undefined) patch.repeat_interval_minutes = body.repeat_interval_minutes

  const { data, error } = await supabase
    .from("reminders")
    .update(patch)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .eq("is_sent", false)
    .select("id, title, remind_at, is_sent, sent_at, channel, repeat_interval_minutes, plan_id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reminder: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
