import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"
import { buildViralAppend, logViralCTASent } from "@/lib/growth/viral"
import { generateText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

function getRiyadhHour(): number {
  return parseInt(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour12: false }).slice(0, 2))
}

function timeOfDayLabel(hour: number, isArabic: boolean): string {
  if (hour < 6)  return isArabic ? "وقت السحر" : "early morning"
  if (hour < 12) return isArabic ? "الصبح" : "morning"
  if (hour < 17) return isArabic ? "الظهر" : "afternoon"
  if (hour < 21) return isArabic ? "المساء" : "evening"
  return isArabic ? "الليل" : "night"
}

async function generateReminderMessage(title: string, isArabic: boolean, hour: number): Promise<string> {
  const tod = timeOfDayLabel(hour, isArabic)
  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      maxOutputTokens: 150,
      messages: [{
        role: "user",
        content: isArabic
          ? `اكتب جملة واحدة قصيرة جداً على واتساب لتذكير شخص بـ: "${title}". الوقت: ${tod}. قواعد: لهجة سعودية خليجية طبيعية، إيموجي مناسب، لا تقل كلمة "تذكير" مباشرة، غيّر الأسلوب — أحياناً ودي أحياناً مضحك أحياناً جاد أحياناً محفز. أرسل الجملة فقط بدون أي شرح.`
          : `Write one very short WhatsApp reminder for: "${title}". Time: ${tod}. Rules: casual and natural, add a fitting emoji, don't say the word "reminder", vary the tone — sometimes caring, sometimes playful, sometimes urgent. Just the sentence, nothing else.`
      }],
    })
    const clean = text.trim().replace(/^["']|["']$/g, "")
    // Reject truncated output: ends with bare definite article "ال" or dangling space
    const looksComplete = clean.length > 5 && !/\sال$/.test(clean) && !/ $/.test(clean)
    return (clean && looksComplete) ? clean : `🔔 ${title}`
  } catch {
    return `🔔 ${title}`
  }
}

export const maxDuration = 60

// Follow-up title encoding: [FU:generation:originalSentAt] CleanTitle
// generation = 1 or 2, originalSentAt = ISO timestamp when original reminder fired
const FU_REGEX = /^\[FU:(\d):([0-9T:.Z+-]+)\] ([\s\S]+)$/

function isQuietHours(): boolean {
  const hour = parseInt(
    new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour12: false }).slice(0, 2)
  )
  return hour >= 23 || hour < 7
}

function log(event: string, detail?: string) {
  console.log(`[Cron/Reminders:${event}] ${new Date().toISOString()}${detail ? " | " + detail : ""}`)
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // Atomically claim due reminders — prevents double-send on overlapping cron runs
  const { data: reminders, error } = await supabase
    .from("reminders")
    .update({ is_sent: true, sent_at: now })
    .lte("remind_at", now)
    .eq("is_sent", false)
    .select("id, user_id, title, channel, remind_at, plan_id, repeat_interval_minutes")
    .limit(50)

  if (error) {
    console.error("[Cron/Reminders] fetch error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Batch-fetch profiles
  const userIds = [...new Set(reminders.map((r) => r.user_id))]
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, phone_number, preferred_language, referral_code")
    .in("id", userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  let sent = 0

  for (const reminder of reminders) {
    const profile = profileMap.get(reminder.user_id) ?? null
    const phone = profile?.phone_number
    if (!phone) continue
    if (reminder.channel !== "whatsapp" && reminder.channel !== "push") continue

    const isArabic = (profile?.preferred_language ?? "ar") !== "en"
    const fuMatch = FU_REGEX.exec(reminder.title)

    try {
      if (fuMatch) {
        // ── Follow-up reminder ────────────────────────────────────────────────
        const generation = parseInt(fuMatch[1]) // 1 or 2
        const originalSentAt = fuMatch[2]
        const cleanTitle = fuMatch[3]

        // Respect quiet hours for proactive follow-ups
        if (isQuietHours()) {
          log("fu_skipped_quiet", `user=${reminder.user_id} gen=${generation}`)
          continue
        }

        // Check if user has replied since the original reminder fired
        const { data: replies } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", reminder.user_id)
          .eq("role", "user")
          .gte("created_at", originalSentAt)
          .limit(1)

        if (replies && replies.length > 0) {
          // User already responded — drop this follow-up silently
          log("fu_skipped_replied", `user=${reminder.user_id} gen=${generation}`)
          continue
        }

        const message = generation === 1
          ? isArabic
            ? `ها بشرت؟ خلصت ولا للحين؟ 👀\n(${cleanTitle})`
            : `Did you get to it? (${cleanTitle}) 👀`
          : isArabic
            ? `ترى باقي لك: ${cleanTitle} 👀`
            : `Still on your list: ${cleanTitle} 👀`

        await sendWhatsAppMessage(phone, message)
        log("follow_up_sent", `user=${reminder.user_id} gen=${generation} title="${cleanTitle.slice(0, 40)}"`)
        sent++

        // Gen 1 → schedule Gen 2 (30 min later); Gen 2 → stop
        if (generation === 1) {
          const fu2At = new Date(Date.now() + 30 * 60 * 1000).toISOString()
          supabase.from("reminders").insert({
            user_id: reminder.user_id,
            title: `[FU:2:${originalSentAt}] ${cleanTitle}`,
            remind_at: fu2At,
            plan_id: reminder.plan_id ?? null,
            channel: "whatsapp",
            is_sent: false,
          }).then(undefined, (e) => console.error("[Cron/Reminders] FU2 insert error:", e))
        }

      } else {
        // ── Regular reminder ──────────────────────────────────────────────────
        const hour = getRiyadhHour()
        let message = await generateReminderMessage(reminder.title, isArabic, hour)

        // Append viral CTA occasionally (perfect value moment — they just got value)
        const referralCode = (profile as { referral_code?: string })?.referral_code
        if (referralCode) {
          const viralAppend = await buildViralAppend(reminder.user_id, referralCode, isArabic)
          if (viralAppend) {
            message += viralAppend
            logViralCTASent(reminder.user_id).catch(() => {})
          }
        }

        await sendWhatsAppMessage(phone, message)
        log("reminder_sent", `user=${reminder.user_id} title="${reminder.title.slice(0, 40)}"`)
        sent++

        // Re-schedule recurring reminder
        if (reminder.repeat_interval_minutes && reminder.repeat_interval_minutes > 0) {
          const nextAt = new Date(
            new Date(reminder.remind_at).getTime() + reminder.repeat_interval_minutes * 60 * 1000
          ).toISOString()
          supabase.from("reminders").insert({
            user_id: reminder.user_id,
            title: reminder.title,
            remind_at: nextAt,
            plan_id: reminder.plan_id ?? null,
            channel: reminder.channel,
            repeat_interval_minutes: reminder.repeat_interval_minutes,
            is_sent: false,
          }).then(undefined, (e) => console.error("[Cron/Reminders] recurring re-insert error:", e))
          log("recurring_scheduled", `user=${reminder.user_id} next="${nextAt}" interval=${reminder.repeat_interval_minutes}min`)
        }

        // Schedule FU1 (30 min later) for WhatsApp plan reminders
        if (reminder.plan_id && reminder.channel === "whatsapp") {
          const fu1At = new Date(Date.now() + 30 * 60 * 1000).toISOString()
          supabase.from("reminders").insert({
            user_id: reminder.user_id,
            title: `[FU:1:${now}] ${reminder.title}`,
            remind_at: fu1At,
            plan_id: reminder.plan_id,
            channel: "whatsapp",
            is_sent: false,
          }).then(undefined, (e) => console.error("[Cron/Reminders] FU1 insert error:", e))
        }
      }

    } catch (err) {
      console.error(`[Cron/Reminders] failed to send reminder ${reminder.id}:`, err)
    }
  }

  return NextResponse.json({ sent, total: reminders.length })
}
