import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("medications")
    .select("id, name, dosage, frequency_hours, first_dose_time, notes, active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ medications: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json() as {
    name: string
    dosage?: string
    frequency_hours: number
    first_dose_time: string
    notes?: string
  }

  if (!body.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 })
  if (!body.frequency_hours || body.frequency_hours <= 0) return NextResponse.json({ error: "frequency_hours required" }, { status: 400 })
  if (!body.first_dose_time) return NextResponse.json({ error: "first_dose_time required" }, { status: 400 })

  const { data: med, error } = await supabase
    .from("medications")
    .insert({
      user_id: user.id,
      name: body.name.trim(),
      dosage: body.dosage?.trim() || null,
      frequency_hours: body.frequency_hours,
      first_dose_time: body.first_dose_time,
      notes: body.notes?.trim() || null,
      active: true,
    })
    .select("id, name, dosage, frequency_hours, first_dose_time, notes, active, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create recurring reminders if user has a phone
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", user.id)
    .single()

  if (profile?.phone_number) {
    // Parse first dose time (HH:MM) in Riyadh time → UTC
    const [hours, minutes] = body.first_dose_time.split(":").map(Number)
    const now = new Date()
    const firstDose = new Date()
    firstDose.setHours(hours, minutes, 0, 0)
    // If first dose time has already passed today, schedule for tomorrow
    if (firstDose <= now) firstDose.setDate(firstDose.getDate() + 1)

    // Convert Riyadh time to UTC (Riyadh = UTC+3)
    const firstDoseUTC = new Date(firstDose.getTime() - 3 * 60 * 60 * 1000)

    const title = body.dosage
      ? `دواء: ${body.name.trim()} — ${body.dosage.trim()}`
      : `دواء: ${body.name.trim()}`

    await supabase.from("reminders").insert({
      user_id: user.id,
      title,
      remind_at: firstDoseUTC.toISOString(),
      channel: "whatsapp",
      is_sent: false,
      repeat_interval_minutes: Math.round(body.frequency_hours * 60),
    })
  }

  return NextResponse.json({ medication: med })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json() as {
    id: string
    name?: string
    dosage?: string
    frequency_hours?: number
    first_dose_time?: string
    notes?: string
    active?: boolean
  }
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (body.name !== undefined) patch.name = body.name.trim()
  if (body.dosage !== undefined) patch.dosage = body.dosage?.trim() || null
  if (body.frequency_hours !== undefined) patch.frequency_hours = body.frequency_hours
  if (body.first_dose_time !== undefined) patch.first_dose_time = body.first_dose_time
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null
  if (body.active !== undefined) patch.active = body.active

  const { data, error } = await supabase
    .from("medications")
    .update(patch)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("id, name, dosage, frequency_hours, first_dose_time, notes, active, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ medication: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { error } = await supabase
    .from("medications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also cancel any pending reminders for this med
  await supabase
    .from("reminders")
    .delete()
    .eq("user_id", user.id)
    .ilike("title", `دواء: %`)
    .eq("is_sent", false)

  return NextResponse.json({ ok: true })
}
