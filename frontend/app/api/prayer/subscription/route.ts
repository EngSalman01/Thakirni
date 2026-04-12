import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

// GET  /api/prayer/subscription  — fetch current user's subscription
// POST /api/prayer/subscription  — upsert subscription
// DELETE /api/prayer/subscription — disable (soft delete)

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("prayer_subscriptions")
    .select("id, phone, prayers, city, enabled")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[prayer/subscription] GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subscription: data ?? null })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json() as {
    prayers?: string[]
    city?: string
    enabled?: boolean
  }

  // Fetch phone from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone_number")
    .eq("id", user.id)
    .single()

  const phone = profile?.phone_number
  if (!phone) {
    return NextResponse.json(
      { error: "no_phone", message: "Add a WhatsApp phone number in your profile first" },
      { status: 422 }
    )
  }

  const service = createServiceClient()
  const { data: existing } = await service
    .from("prayer_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await service
      .from("prayer_subscriptions")
      .update({
        phone,
        prayers: body.prayers ?? ["fajr", "dhuhr", "asr", "maghrib", "isha"],
        city: body.city ?? "riyadh",
        enabled: body.enabled ?? true,
      })
      .eq("id", existing.id)

    if (error) {
      console.error("[prayer/subscription] UPDATE error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await service
      .from("prayer_subscriptions")
      .insert({
        user_id: user.id,
        phone,
        prayers: body.prayers ?? ["fajr", "dhuhr", "asr", "maghrib", "isha"],
        city: body.city ?? "riyadh",
        enabled: body.enabled ?? true,
      })

    if (error) {
      console.error("[prayer/subscription] INSERT error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const service = createServiceClient()
  const { error } = await service
    .from("prayer_subscriptions")
    .update({ enabled: false })
    .eq("user_id", user.id)

  if (error) {
    console.error("[prayer/subscription] DELETE error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
