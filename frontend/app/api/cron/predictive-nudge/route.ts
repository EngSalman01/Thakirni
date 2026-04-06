/**
 * Predictive nudge cron.
 * Runs periodically (recommend: every 6 hours) to proactively
 * engage users based on behavioral patterns detected by the predictor.
 *
 * Skips:
 *   - Users with no phone number
 *   - Quiet hours (23:00–07:00 Riyadh)
 *   - If the same insight was sent in the last 24 hours
 */

import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"
import {
  detectPredictiveOpportunities,
  markInsightSent,
  wasInsightRecentlySent,
} from "@/lib/ai/predictor"

export const maxDuration = 60

function isQuietHours(): boolean {
  const hour = parseInt(
    new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour12: false }).slice(0, 2)
  )
  return hour >= 23 || hour < 7
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  if (isQuietHours()) {
    return NextResponse.json({ skipped: "quiet_hours" })
  }

  const supabase = createServiceClient()

  // Fetch all active users with phone numbers who have been active in last 30 days
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: activeUsers } = await supabase
    .from("conversations")
    .select("user_id")
    .eq("role", "user")
    .gte("created_at", since30d)

  const userIds = [...new Set((activeUsers ?? []).map((r: { user_id: string }) => r.user_id))]
  if (userIds.length === 0) return NextResponse.json({ sent: 0 })

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, phone_number, preferred_language, plan_tier")
    .in("id", userIds)
    .not("phone_number", "is", null)

  if (!profiles || profiles.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  let skipped = 0

  for (const profile of profiles as { id: string; phone_number: string; preferred_language: string | null; plan_tier: string | null }[]) {
    try {
      const isArabic = (profile.preferred_language ?? "ar") !== "en"

      // Compute usage ratio for upgrade nudge
      const month = new Date().toISOString().slice(0, 7)
      const { data: usageRow } = await supabase
        .from("usage")
        .select("ai_chat_requests")
        .eq("user_id", profile.id)
        .eq("month", month)
        .single()
      const aiUsed = (usageRow as { ai_chat_requests: number } | null)?.ai_chat_requests ?? 0
      const limits: Record<string, number> = { FREE: 30, PRO: 500, TEAMS: 2000 }
      const limit = limits[(profile.plan_tier ?? "FREE").toUpperCase()] ?? 30
      const usageRatio = aiUsed / limit

      const insights = await detectPredictiveOpportunities(profile.id, null, { usageRatio })

      // Send only one nudge per run per user — highest priority, not recently sent
      for (const insight of insights) {
        // Don't spam upgrade prompts — only once per 48h
        const cooldown = insight.type === "upgrade_prompt" ? 48 : 24
        const alreadySent = await wasInsightRecentlySent(profile.id, insight.type, cooldown)
        if (alreadySent) continue

        const message = isArabic ? insight.messageAr : insight.messageEn
        await sendWhatsAppMessage(profile.phone_number, message)
        await markInsightSent(profile.id, insight.type, insight.payload)

        console.log(`[Cron/PredictiveNudge] sent | user=${profile.id} type=${insight.type}`)
        sent++
        break // one nudge per user per run
      }

      if (insights.length === 0 || insights.every(async i => wasInsightRecentlySent(profile.id, i.type, 24))) {
        skipped++
      }
    } catch (err) {
      console.error(`[Cron/PredictiveNudge] failed for user ${profile.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
