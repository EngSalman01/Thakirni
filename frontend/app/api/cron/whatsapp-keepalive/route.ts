/**
 * Anti-churn keepalive — detects inactive users and re-engages.
 *
 * Segments by inactivity length for targeted messaging:
 *   18–36h  → light check-in ("هلا 😄")
 *   36–72h  → stronger nudge ("وينك مختفي؟ 👀")
 *   72–168h → recovery offer ("تبغاني أرتب لك جدول بسيط ترجع؟")
 *   > 7d    → skip (handled separately by churn flow)
 *
 * Anti-spam: max one keepalive per user per 36h (via nudge_log).
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

const H = 60 * 60 * 1000
const TIERS = [
  { minH: 18,  maxH: 36,  typeAr: "light",    typeEn: "light" },
  { minH: 36,  maxH: 72,  typeAr: "medium",   typeEn: "medium" },
  { minH: 72,  maxH: 168, typeAr: "strong",   typeEn: "strong" },
] as const

function isQuietHours(): boolean {
  const hour = parseInt(
    new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour12: false }).slice(0, 2)
  )
  return hour >= 23 || hour < 8
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader?.toLowerCase() !== `bearer ${process.env.CRON_SECRET?.toLowerCase()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (isQuietHours()) {
    return NextResponse.json({ skipped: "quiet_hours" })
  }

  const supabase = createServiceClient()
  const now = Date.now()

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, preferred_language")
    .not("phone_number", "is", null)

  if (error) {
    console.error("[Cron/WhatsAppKeepalive] profiles fetch error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const profile of profiles ?? []) {
    try {
      // Check anti-spam (max 1 keepalive per 36h)
      const since36h = new Date(now - 36 * H).toISOString()
      const { data: recentNudge } = await supabase
        .from("nudge_log")
        .select("id")
        .eq("user_id", profile.id)
        .like("nudge_type", "keepalive_%")
        .gte("sent_at", since36h)
        .limit(1)

      if ((recentNudge ?? []).length > 0) { skipped++; continue }

      // Get last user conversation
      const { data: lastMsg } = await supabase
        .from("conversations")
        .select("created_at")
        .eq("user_id", profile.id)
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!lastMsg?.created_at) { skipped++; continue }

      const inactiveMs = now - new Date(lastMsg.created_at).getTime()
      const inactiveH = inactiveMs / H

      // Find which tier this user falls into
      const tier = TIERS.find(t => inactiveH >= t.minH && inactiveH < t.maxH)
      if (!tier) { skipped++; continue }

      const isArabic = (profile.preferred_language ?? "ar") !== "en"
      const firstName = (profile.full_name ?? "").split(" ")[0] || (isArabic ? "صديقي" : "there")

      let message: string
      let nudgeType: string

      if (tier.minH < 36) {
        // Light check-in
        nudgeType = "keepalive_light"
        message = isArabic
          ? `👋 هلا ${firstName} 😄 ترى أنا موجود — لو احتجتني اكتب لي بس`
          : `👋 Hey ${firstName} 😄 I'm here if you need me, just text me anytime`
      } else if (tier.minH < 72) {
        // Medium nudge
        nudgeType = "keepalive_medium"
        message = isArabic
          ? `👀 وينك مختفي ${firstName}؟\n\nعندك شي تبغى تنجزه اليوم؟ قول لي وأساعدك 👌`
          : `👀 ${firstName}, you've been quiet!\n\nGot something to get done today? Tell me and I'll help 👌`
      } else {
        // Strong recovery
        nudgeType = "keepalive_strong"
        message = isArabic
          ? [
              `هلا ${firstName} 👋`,
              "",
              "فترة ما شفتك 😄",
              "",
              "تبغاني أرتب لك جدول بسيط وترجع لمسارك؟",
              "قول لي \"ابدأ معي\" وأبدأ معك من الصفر 👌",
            ].join("\n")
          : [
              `Hey ${firstName} 👋`,
              "",
              "It's been a while! 😄",
              "",
              "Want me to set up a simple schedule to get you back on track?",
              "Just say \"let's start\" and I'll help from scratch 👌",
            ].join("\n")
      }

      await sendWhatsAppMessage(profile.phone_number, message)
      await supabase.from("nudge_log").insert({
        user_id: profile.id,
        nudge_type: nudgeType,
        channel: "whatsapp",
      })

      sent++
      console.log(`[Cron/WhatsAppKeepalive] sent | user=${profile.id} type=${nudgeType} inactiveH=${Math.round(inactiveH)}`)

    } catch (err) {
      console.error(`[Cron/WhatsAppKeepalive] failed for user ${profile.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
