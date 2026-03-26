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

  for (const profile of profiles ?? []) {
    try {
      const isArabic = (profile.preferred_language ?? "ar") !== "en"
      const message = isArabic
        ? "👋 ذكرني هنا! أرسل لنا أي شيء للبقاء متصلاً بتذكيراتك."
        : "👋 Thakirni here! Reply with anything to keep your reminders active."

      await sendWhatsAppMessage(profile.phone_number, message)
      sent++
    } catch (err) {
      console.error(`[Cron/WhatsAppKeepalive] failed for user ${profile.id}:`, err)
    }
  }

  return NextResponse.json({ sent })
}
