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

    // Normalize phone
    const normalized = phone.startsWith("0")
      ? "966" + phone.slice(1)
      : phone.startsWith("+")
      ? phone.slice(1)
      : phone

    // Save phone number to profile
    await supabase
      .from("profiles")
      .update({ phone_number: normalized })
      .eq("id", user.id)

    const firstName = (name ?? "").split(" ")[0] || "صديقي"
    const cases = useCases ?? []
    const isArabicUser = true // Saudi-first product

    // Build a personalized welcome based on use cases
    let useCaseHint = ""
    if (isArabicUser) {
      if (cases.includes("reminders"))
        useCaseHint = "\n• قول لي \"ذكرني بشي\" وأحطه لك فوراً ⏰"
      else if (cases.includes("tasks") || cases.includes("goals"))
        useCaseHint = "\n• قول لي \"عندي مهمة\" وأضيفها لك ✅"
      else if (cases.includes("meetings"))
        useCaseHint = "\n• رسّل لي تسجيل الاجتماع وألخصه لك 🎙️"
      else
        useCaseHint = "\n• قول لي \"رتب لي يومي\" وأبدأ معك 📅"
    }

    const message = isArabicUser
      ? [
          `هلا ${firstName}! 👋`,
          "",
          "أنا مساعدك في *ذكرني* — موجود ٢٤/٧ على واتساب.",
          "",
          "جرب الحين:",
          "• \"وش عندي اليوم؟\" 📋",
          "• \"رتب لي يومي\" 🗓️",
          `• \"ذكرني الساعة ٦ بـ...\" ⏰${useCaseHint}`,
          "",
          "كل صباح تصلك رسالة بملخص يومك. 🌅",
          "",
          "ابدأ بأي رسالة تبغاها 👌",
        ].join("\n")
      : [
          `Hey ${firstName}! 👋`,
          "",
          "I'm your *Thakirni* assistant — available 24/7 on WhatsApp.",
          "",
          "Try now:",
          "• \"What do I have today?\" 📋",
          "• \"Plan my day\" 🗓️",
          "• \"Remind me at 6pm to...\" ⏰",
          "",
          "Every morning you'll get a personalized day briefing. 🌅",
          "",
          "Just send me anything to get started 👌",
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
