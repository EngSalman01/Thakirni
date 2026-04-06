/**
 * Activation boost — the critical Day 0 conversion cron.
 * Run every 5 minutes.
 *
 * Two-wave strategy:
 *   Wave 1 (5–15 min after signup):
 *     "هلا 👋 وش تبغى أرتب لك اليوم؟"
 *     → Starts the conversation immediately
 *
 *   Wave 2 (20–35 min after signup, no response yet):
 *     "جرب تقول: وش عندي اليوم؟ 👀"
 *     → Teaches the magic phrase that triggers value
 *
 * Anti-spam: nudge_log prevents re-sending each wave.
 * Only targets users who provided a phone number during onboarding.
 */

import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 30

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const supabase = createServiceClient()
  const now = Date.now()

  // Wave 1 window: signed up 5–15 min ago
  const wave1Min = new Date(now - 15 * 60 * 1000).toISOString()
  const wave1Max = new Date(now - 5  * 60 * 1000).toISOString()

  // Wave 2 window: signed up 20–35 min ago
  const wave2Min = new Date(now - 35 * 60 * 1000).toISOString()
  const wave2Max = new Date(now - 20 * 60 * 1000).toISOString()

  // Fetch all new-ish users with phone numbers
  const { data: candidates } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, preferred_language, created_at")
    .not("phone_number", "is", null)
    .gte("created_at", wave2Min) // oldest window start
    .lte("created_at", wave1Max) // newest window end

  if (!candidates || candidates.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0

  for (const profile of candidates as {
    id: string
    full_name: string | null
    phone_number: string
    preferred_language: string | null
    created_at: string
  }[]) {
    try {
      const signedUpAt = new Date(profile.created_at).getTime()
      const isWave1 = signedUpAt >= new Date(wave1Min).getTime()
      const isWave2 = !isWave1 && signedUpAt >= new Date(wave2Min).getTime()

      if (!isWave1 && !isWave2) continue

      const isArabic = (profile.preferred_language ?? "ar") !== "en"
      const firstName = (profile.full_name ?? "").split(" ")[0] || (isArabic ? "صديقي" : "there")
      const nudgeType = isWave1 ? "activation_wave1" : "activation_wave2"

      // Check already sent this wave
      const { data: alreadySent } = await supabase
        .from("nudge_log")
        .select("id")
        .eq("user_id", profile.id)
        .eq("nudge_type", nudgeType)
        .limit(1)

      if ((alreadySent ?? []).length > 0) continue

      // Wave 2: check if user already responded (skip if yes)
      if (isWave2) {
        const { data: conv } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", profile.id)
          .eq("role", "user")
          .limit(1)

        if ((conv ?? []).length > 0) continue // already active — skip wave 2
      }

      let message: string

      if (isWave1) {
        message = isArabic
          ? `هلا ${firstName} 👋\n\nوش تبغى أرتب لك اليوم؟ 👀`
          : `Hey ${firstName} 👋\n\nWhat would you like me to help you with today? 👀`
      } else {
        // Wave 2 — teach the magic phrases
        message = isArabic
          ? [
              `${firstName} جرب تقول لي 👇`,
              "",
              `• "وش عندي اليوم؟"`,
              `• "ذكرني بكرة بشي مهم"`,
              `• "رتب لي يومي"`,
              "",
              "أنا هنا وجاهز 👌",
            ].join("\n")
          : [
              `${firstName} try saying 👇`,
              "",
              `• "What do I have today?"`,
              `• "Remind me tomorrow about something important"`,
              `• "Plan my day"`,
              "",
              "I'm here and ready 👌",
            ].join("\n")
      }

      await sendWhatsAppMessage(profile.phone_number, message)
      await supabase.from("nudge_log").insert({
        user_id: profile.id,
        nudge_type: nudgeType,
        channel: "whatsapp",
      })

      sent++
      console.log(`[Cron/ActivationBoost] sent wave${isWave1 ? 1 : 2} | user=${profile.id}`)

    } catch (err) {
      console.error(`[Cron/ActivationBoost] failed for user ${profile.id}:`, err)
    }
  }

  return NextResponse.json({ sent })
}
