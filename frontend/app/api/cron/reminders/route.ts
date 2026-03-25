import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // Fetch all due, unsent reminders
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("id, user_id, title, channel, remind_at")
    .lte("remind_at", now)
    .eq("is_sent", false)
    .limit(50)

  if (error) {
    console.error("[Cron/Reminders] fetch error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Fetch profiles for all reminder owners in one query
  const userIds = [...new Set(reminders.map((r) => r.user_id))]
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, phone_number, preferred_language")
    .in("id", userIds)

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  )

  let sent = 0
  const sentIds: string[] = []

  for (const reminder of reminders) {
    const profile = profileMap.get(reminder.user_id) ?? null
    const phone = profile?.phone_number
    const isArabic = (profile?.preferred_language ?? "ar") !== "en"

    try {
      if ((reminder.channel === "whatsapp" || reminder.channel === "push") && phone) {
        const locale = isArabic ? "ar-SA" : "en-GB"
        const reminderTime = new Date(reminder.remind_at).toLocaleString(locale, {
          timeZone: "Asia/Riyadh",
          dateStyle: "short",
          timeStyle: "short",
        })
        const message = isArabic
          ? `🔔 تذكير: ${reminder.title}\n⏰ ${reminderTime}`
          : `🔔 Reminder: ${reminder.title}\n⏰ ${reminderTime}`
        await sendWhatsAppMessage(phone, message)
      }
      sentIds.push(reminder.id)
      sent++
    } catch (err) {
      console.error(`[Cron/Reminders] failed to send reminder ${reminder.id}:`, err)
      // Still mark as sent to avoid infinite retries on permanent failures
      sentIds.push(reminder.id)
    }
  }

  // Mark all processed reminders as sent
  if (sentIds.length > 0) {
    await supabase
      .from("reminders")
      .update({ is_sent: true, sent_at: now })
      .in("id", sentIds)
  }

  return NextResponse.json({ sent, total: reminders.length })
}
