import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/compliance/audit"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { version?: string }
  const version = body.version ?? "1.0"

  const service = createServiceClient()

  const { error: insertError } = await service
    .from("consent_logs")
    .upsert(
      { user_id: user.id, version, accepted_at: new Date().toISOString() },
      { onConflict: "user_id,version" }
    )

  if (insertError) {
    console.error("[Consent] insert error:", insertError)
    return NextResponse.json({ error: "Failed to record consent" }, { status: 500 })
  }

  await logAuditEvent(user.id, "consent_given", `User gave consent to data processing (v${version})`, {
    version,
  })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()
  const { data } = await service
    .from("consent_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("version", "1.0")
    .maybeSingle()

  return NextResponse.json({ consented: data !== null })
}
