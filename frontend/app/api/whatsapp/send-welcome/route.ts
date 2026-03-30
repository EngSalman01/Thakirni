import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { phone, name } = await req.json()
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone required" }, { status: 400 })
    }

    // Normalize phone: strip leading 0, ensure Saudi prefix
    const normalized = phone.startsWith("0")
      ? "966" + phone.slice(1)
      : phone.startsWith("+")
      ? phone.slice(1)
      : phone

    const displayName = name || "مستخدم ذكرني"

    const message = [
      `أهلاً ${displayName} 👋`,
      "أنا مساعدك في *ذكرني*! جاهز أساعدك في تنظيم مهامك، تذكيراتك، وأهدافك.",
      "",
      `Hi ${displayName} 👋`,
      "I'm your *Thakirni* assistant! Ready to help you stay organized with tasks, reminders, and goals.",
      "",
      "ابدأ بإرسال أي رسالة / Just send me a message to get started 🚀",
    ].join("\n")

    await sendWhatsAppMessage(normalized, message)

    // Log the event for activation tracking
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: "whatsapp_welcome_sent",
      properties: { phone: normalized },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[send-welcome]", err)
    // Never block onboarding if WhatsApp fails
    return NextResponse.json({ ok: true })
  }
}
