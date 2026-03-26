import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")

  if (authHeader?.toLowerCase() !== `bearer ${process.env.CRON_SECRET?.toLowerCase()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, phone_number, preferred_language")
    .not("phone_number", "is", null)

  if (error) {
    console.error("[Cron/WhatsAppKeepalive] profiles fetch error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0

  const arabicMessages = [
    "👋 هلا 😄 ترى أنا موجود… لو احتجتني اكتب لي بس",
    "👀 وينك مختفي؟ اكتب لي لو تحتاج شي",
    "😄 تذكير بسيط… أنا هنا لو احتجتني",
  ]

  const englishMessages = [
    "👋 hey 😄 I'm here if you need me, just text me anytime",
    "👀 you disappeared… text me if you need anything",
    "😄 quick reminder, I'm here whenever you need me",
  ]

  const now = Date.now()
  const INACTIVE_THRESHOLD = 18 * 60 * 60 * 1000 // 18 hours

  for (const profile of profiles ?? []) {
    try {
      // 🧠 Get last user interaction
      const { data: lastMessage } = await supabase
        .from("conversations")
        .select("created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // If no history → skip (or send onboarding separately)
      if (!lastMessage?.created_at) continue

      const lastTime = new Date(lastMessage.created_at).getTime()
      const diff = now - lastTime

      // ⛔ Skip if user is still active
      if (diff < INACTIVE_THRESHOLD) continue

      const isArabic = (profile.preferred_language ?? "ar") !== "en"

      const message = isArabic
        ? arabicMessages[Math.floor(Math.random() * arabicMessages.length)]
        : englishMessages[Math.floor(Math.random() * englishMessages.length)]

      await sendWhatsAppMessage(profile.phone_number, message)
      sent++

    } catch (err) {
      console.error(`[Cron/WhatsAppKeepalive] failed for user ${profile.id}:`, err)
    }
  }

  return NextResponse.json({ sent })
}