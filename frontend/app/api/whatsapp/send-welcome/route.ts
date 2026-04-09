import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { phone, name, useCases } = await req.json() as {
      phone: string
      name?: string
      useCases?: string[]
    }
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone required" }, { status: 400 })
    }

    // Normalize to E.164 digits only (strip +, handle legacy 0-prefix Saudi numbers)
    const normalized = phone.startsWith("+")
      ? phone.slice(1).replace(/\s/g, "")
      : phone.startsWith("0")
      ? "966" + phone.slice(1).replace(/\s/g, "")
      : phone.replace(/\s/g, "")

    // Save phone number to profile
    await supabase
      .from("profiles")
      .update({ phone_number: normalized })
      .eq("id", user.id)

    const firstName = (name ?? "").split(" ")[0] || "صديقي"

    // Bilingual welcome — Arabic + English for all users worldwide
    const message = [
      `هلا ${firstName}! / Hey ${firstName}! 👋`,
      "",
      "أنا مساعدك الذكي في *ذكرني* — موجود ٢٤/٧ على واتساب.",
      "I'm your *Thakirni* AI assistant — here 24/7 on WhatsApp.",
      "",
      "جرب الحين | Try now:",
      "• وش عندي اليوم؟ / What do I have today? 📋",
      "• رتب لي يومي / Plan my day 🗓️",
      "• ذكرني الساعة ٦ بـ... / Remind me at 6pm to... ⏰",
      "",
      "كل صباح تصلك رسالة بملخص يومك ☀️",
      "You'll get a daily morning briefing every day ☀️",
      "",
      "ابدأ بأي رسالة تبغاها 👌 | Just send anything to get started 👌",
    ].join("\n")

    await sendWhatsAppMessage(normalized, message)

    // Mark welcomed + onboarding milestone (idempotent)
    await Promise.all([
      supabase.rpc("mark_whatsapp_welcomed", { p_user_id: user.id }),
      supabase.rpc("mark_onboarding_step", { p_user_id: user.id, p_step: "connected_whatsapp" }),
    ])

    // Track analytics
    supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: "whatsapp_welcome_sent",
      properties: { phone: normalized, use_cases: cases },
    }).then(undefined, () => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[send-welcome]", err)
    return NextResponse.json({ ok: true }) // Never block onboarding
  }
}
