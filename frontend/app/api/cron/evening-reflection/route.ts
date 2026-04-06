/**
 * Evening reflection cron — runs at 8–9 PM Riyadh time.
 * Builds the daily habit loop: user checks in every evening.
 *
 * Logic:
 *   - Fetch users with phone numbers
 *   - Count today's pending vs completed plans
 *   - If all done → celebrate
 *   - If incomplete → offer to reschedule
 *   - If nothing → gentle prompt
 *
 * Anti-spam: only sends once per user per day (via nudge_log)
 */

import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

function isEveningWindow(): boolean {
  const hour = parseInt(
    new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour12: false }).slice(0, 2)
  )
  return hour >= 19 && hour < 23
}

async function wasRecentlySent(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  nudgeType: string,
  withinHours = 20
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from("nudge_log")
    .select("id")
    .eq("user_id", userId)
    .eq("nudge_type", nudgeType)
    .gte("sent_at", since)
    .limit(1)
  return (data ?? []).length > 0
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  if (!isEveningWindow()) {
    return NextResponse.json({ skipped: "outside_evening_window" })
  }

  const supabase = createServiceClient()
  const riyadhDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, preferred_language")
    .not("phone_number", "is", null)

  if (!profiles || profiles.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  let skipped = 0

  for (const profile of profiles as { id: string; full_name: string | null; phone_number: string; preferred_language: string | null }[]) {
    try {
      // Anti-spam: one evening reflection per day
      const alreadySent = await wasRecentlySent(supabase, profile.id, "evening_reflection", 20)
      if (alreadySent) { skipped++; continue }

      const isArabic = (profile.preferred_language ?? "ar") !== "en"
      const firstName = (profile.full_name ?? "").split(" ")[0] || (isArabic ? "صديقي" : "there")

      // Fetch today's plans (status values: "pending" | "done")
      const [pendingResult, doneResult] = await Promise.all([
        supabase
          .from("plans")
          .select("id, title")
          .eq("user_id", profile.id)
          .eq("plan_date", riyadhDate)
          .eq("status", "pending")
          .limit(10),
        supabase
          .from("plans")
          .select("id")
          .eq("user_id", profile.id)
          .eq("plan_date", riyadhDate)
          .eq("status", "done")
          .limit(50),
      ])

      const pendingTasks = pendingResult.data ?? []
      const doneCount = (doneResult.data ?? []).length
      const pendingCount = pendingTasks.length

      let message: string

      const total = doneCount + pendingCount

      if (pendingCount === 0 && doneCount === 0) {
        // Nothing was planned today
        if (isArabic) {
          message = [
            `كيف كان يومك ${firstName}؟ 👀`,
            "",
            "خلصت كل شي؟",
            "• قول لي \"خلصت\" أو \"باقي\" 👌",
          ].join("\n")
        } else {
          message = `How was your day ${firstName}? 👀\n\nDid you get everything done?\n• Reply \"done\" or \"still going\" 👌`
        }
      } else if (pendingCount === 0) {
        // All tasks done! 🔥
        if (isArabic) {
          message = [
            `${firstName} 🔥`,
            "",
            `خلصت ${doneCount} ${doneCount === 1 ? "مهمة" : "مهام"} اليوم — كفو! 👏`,
            "",
            "تبغى أرتب لك غداً؟ 👀",
          ].join("\n")
        } else {
          message = [
            `${firstName} 🔥`,
            "",
            `You completed ${doneCount} task${doneCount > 1 ? "s" : ""} today — well done! 👏`,
            "",
            "Want me to plan tomorrow? 👀",
          ].join("\n")
        }
      } else {
        // Some tasks still pending
        const taskList = pendingTasks
          .slice(0, 3)
          .map((t: { title: string }) => `• ${t.title}`)
          .join("\n")
        const more = pendingCount > 3 ? (isArabic ? `\n+ ${pendingCount - 3} أخرى` : `\n+ ${pendingCount - 3} more`) : ""
        const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

        if (isArabic) {
          message = [
            `كيف كان يومك ${firstName}؟ 👀`,
            "",
            `أنجزت ${doneCount} من ${total} مهام (${pct}%) ✅`,
            "",
            `باقي لك:`,
            taskList + more,
            "",
            "تبغاني أرتبها لك لبكرة؟ 👀",
          ].join("\n")
        } else {
          message = [
            `How was your day ${firstName}? 👀`,
            "",
            `You got ${doneCount}/${total} done (${pct}%) ✅`,
            "",
            `Still pending:`,
            taskList + more,
            "",
            "Want me to reschedule them for tomorrow? 👀",
          ].join("\n")
        }
      }

      // Refresh daily streak async
      supabase.rpc("refresh_daily_streak", { p_user_id: profile.id }).then(undefined, () => {})

      await sendWhatsAppMessage(profile.phone_number, message)

      // Log sent nudge
      await supabase.from("nudge_log").insert({
        user_id: profile.id,
        nudge_type: "evening_reflection",
        channel: "whatsapp",
      })

      sent++
      console.log(`[Cron/EveningReflection] sent | user=${profile.id} pending=${pendingCount} done=${doneCount}`)

    } catch (err) {
      console.error(`[Cron/EveningReflection] failed for user ${profile.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
