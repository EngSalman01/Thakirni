import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const rl = await limiters.form(ip)
  if (!rl.success) return rateLimitResponse(rl.reset)

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const name    = String(body.name    ?? "").trim()
  const email   = String(body.email   ?? "").trim()
  const company = String(body.company ?? "").trim()

  if (!name || !email || !company) {
    return NextResponse.json({ error: "Name, email, and company are required" }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  }

  const supabase = await createClient()

  // Store lead in CRM
  const { error: dbError } = await supabase.from("leads").insert({
    name,
    email,
    company,
    phone:     String(body.phone     ?? "").trim() || null,
    team_size: String(body.team_size ?? "").trim() || null,
    use_case:  String(body.use_case  ?? "").trim() || null,
    message:   String(body.message   ?? "").trim() || null,
    source:    "enterprise_form",
    status:    "new",
  })

  if (dbError) {
    console.error("[enterprise/demo] DB insert failed:", dbError)
    // Don't fail the request — still send notification
  }

  // Notify admin via WhatsApp
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE
  if (adminPhone) {
    const teamSize = body.team_size ? ` | Team: ${body.team_size}` : ""
    const useCase  = body.use_case  ? ` | Use: ${body.use_case}`  : ""
    const phone    = body.phone     ? ` | 📱 +966${body.phone}`   : ""
    await sendWhatsAppMessage(
      adminPhone,
      `🏢 *New Enterprise Lead!*\n\n👤 ${name}\n📧 ${email}\n🏢 ${company}${teamSize}${useCase}${phone}\n\n📝 ${body.message || "No message"}\n\nReply at: thakirni.com/admin`
    ).catch(e => console.error("[enterprise/demo] WhatsApp notify failed:", e))
  }

  return NextResponse.json({ success: true })
}
