/**
 * First-day retention nudge — run every 3 hours.
 *
 * Targets users who signed up < 24h ago but haven't been active
 * in the last 6–12h. This is the critical drop-off window.
 *
 * Messages are warm and helpful (never pushy).
 * Max 2 nudges per new user in their first 24h.
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

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

  // Users who signed up in last 24h
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString()

  const { data: newProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, preferred_language, created_at")
    .gte("created_at", since24h)
    .not("phone_number", "is", null)

  if (!newProfiles || newProfiles.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  let skipped = 0

  for (const profile of newProfiles as {
    id: string
    full_name: string | null
    phone_number: string
    preferred_language: string | null
    created_at: string
  }[]) {
    try {
      // Check how many day-1 nudges already sent (max 2)
      const since48h = new Date(now - 48 * 60 * 60 * 1000).toISOString()
      const { data: sentNudges } = await supabase
        .from("nudge_log")
        .select("id, sent_at")
        .eq("user_id", profile.id)
        .in("nudge_type", ["day1_checkin", "day1_inactive"])
        .gte("sent_at", since48h)

      if ((sentNudges ?? []).length >= 2) { skipped++; continue }

      // Check last activity (conversation)
      const { data: lastConv } = await supabase
        .from("conversations")
        .select("created_at")
        .eq("user_id", profile.id)
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      const lastActiveMs = lastConv?.created_at
        ? new Date(lastConv.created_at).getTime()
        : new Date(profile.created_at).getTime()

      const inactiveMs = now - lastActiveMs
      const signedUpMsAgo = now - new Date(profile.created_at).getTime()

      // Only nudge if inactive 6-18h (sweet spot: not too soon, not too late)
      if (inactiveMs < 6 * 60 * 60 * 1000) { skipped++; continue }
      if (inactiveMs > 18 * 60 * 60 * 1000) { skipped++; continue }

      const isArabic = (profile.preferred_language ?? "ar") !== "en"
      const firstName = (profile.full_name ?? "").split(" ")[0] || (isArabic ? "صديقي" : "there")

      // First nudge vs second nudge
      const isFirstNudge = (sentNudges ?? []).length === 0

      let message: string
      let nudgeType: string

      if (isFirstNudge) {
        nudgeType = "day1_checkin"
        const hoursSinceSignup = Math.round(signedUpMsAgo / (60 * 60 * 1000))

        if (isArabic) {
          message = [
            `هلا ${firstName} 👋`,
            "",
            "كيف وضعك؟ جربت ذكرني بعد ما سجلت؟ 👀",
            "",
            "أقدر أرتب لك يومك كامل — قول لي بس:",
            "\"رتب لي يومي\" أو \"وش عندي اليوم؟\" 👌",
          ].join("\n")
        } else {
          message = [
            `Hey ${firstName} 👋`,
            "",
            `You signed up ${hoursSinceSignup}h ago — have you tried Thakirni yet? 👀`,
            "",
            "I can plan your whole day — just say:",
            "\"Plan my day\" or \"What do I have today?\" 👌",
          ].join("\n")
        }
      } else {
        nudgeType = "day1_inactive"
        if (isArabic) {
          message = isArabic
            ? `${firstName} ترى أقدر أرتب لك جدول بسيط ترجع فيه 📅\n\nقول لي \"ابدأ معي\" وأسويها 👌`
            : `${firstName} I can set up a simple schedule to keep you on track 📅\n\nJust say "get started" and I'll set it up 👌`
        } else {
          message = `${firstName} I can set up a simple schedule to keep you on track 📅\n\nJust say "get started" and I'll set it up 👌`
        }
      }

      await sendWhatsAppMessage(profile.phone_number, message)
      await supabase.from("nudge_log").insert({
        user_id: profile.id,
        nudge_type: nudgeType,
        channel: "whatsapp",
      })

      sent++
      console.log(`[Cron/FirstDayNudge] sent | user=${profile.id} type=${nudgeType}`)

    } catch (err) {
      console.error(`[Cron/FirstDayNudge] failed for user ${profile.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
