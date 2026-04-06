import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

interface GCalEvent {
  id: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  location?: string
}

interface Profile {
  id: string
  full_name: string | null
  phone_number: string
  preferred_language: string | null
  google_calendar_token: string | null
  google_calendar_refresh_token: string | null
  google_calendar_expires_at: string | null
  gcal_whatsapp_reminders: boolean
}

async function refreshToken(profile: Profile, supabase: ReturnType<typeof createServiceClient>): Promise<string | null> {
  if (!profile.google_calendar_refresh_token) return null
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: profile.google_calendar_refresh_token,
        grant_type:    "refresh_token",
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { access_token: string; expires_in: number }
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
    await supabase.from("profiles").update({ google_calendar_token: data.access_token, google_calendar_expires_at: expiresAt }).eq("id", profile.id)
    return data.access_token
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const supabase = createServiceClient()

  // Window: events starting between now+25min and now+35min (10-min window centred on 30 min)
  const windowStart = new Date(Date.now() + 25 * 60 * 1000).toISOString()
  const windowEnd   = new Date(Date.now() + 35 * 60 * 1000).toISOString()

  // Fetch users with GCal connected AND whatsapp reminders enabled AND a phone number
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, preferred_language, google_calendar_token, google_calendar_refresh_token, google_calendar_expires_at, gcal_whatsapp_reminders")
    .eq("gcal_whatsapp_reminders", true)
    .not("phone_number", "is", null)
    .not("google_calendar_token", "is", null)

  if (error) {
    console.error("[Cron/GcalReminders] profiles fetch error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0

  for (const profile of (profiles ?? []) as Profile[]) {
    try {
      let token = profile.google_calendar_token!

      // Refresh token if expired
      if (profile.google_calendar_expires_at) {
        const expiresAt = new Date(profile.google_calendar_expires_at).getTime()
        if (Date.now() > expiresAt - 60_000) {
          const refreshed = await refreshToken(profile, supabase)
          if (!refreshed) continue
          token = refreshed
        }
      }

      const headers = { Authorization: `Bearer ${token}` }

      // Fetch all calendars
      const calListRes = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50",
        { headers }
      )
      if (!calListRes.ok) continue

      const calList = await calListRes.json() as { items?: { id: string; selected?: boolean }[] }
      const calendars = (calList.items ?? []).filter(c => c.selected !== false)

      const qp = new URLSearchParams({ timeMin: windowStart, timeMax: windowEnd, singleEvents: "true", maxResults: "10" })

      const results = await Promise.allSettled(
        calendars.map(cal =>
          fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${qp}`, { headers })
            .then(r => r.ok ? r.json() : { items: [] })
            .then((d: { items?: GCalEvent[] }) => d.items ?? [])
        )
      )

      // Skip all-day events — they have start.date but no start.dateTime.
      // The "starts in 30 minutes" message is wrong for them, and the GCal API
      // returns them for the entire day which causes infinite repeat sends.
      const upcomingEvents = (results.flatMap(r => r.status === "fulfilled" ? r.value : []) as GCalEvent[])
        .filter(e => !!e.start?.dateTime)
      if (upcomingEvents.length === 0) continue

      // Check which events we've already sent reminders for
      const eventIds = upcomingEvents.map(e => e.id).filter(Boolean)
      const { data: alreadySent } = await supabase
        .from("gcal_sent_reminders")
        .select("event_id")
        .eq("user_id", profile.id)
        .in("event_id", eventIds)

      const sentSet = new Set((alreadySent ?? []).map(r => r.event_id))
      const newEvents = upcomingEvents.filter(e => e.id && !sentSet.has(e.id))
      if (newEvents.length === 0) continue

      const isArabic = (profile.preferred_language ?? "ar") !== "en"
      const name = profile.full_name ?? (isArabic ? "صديقي" : "there")

      for (const event of newEvents) {
        const title = event.summary ?? (isArabic ? "حدث" : "Event")
        const loc = event.location ? ` · ${event.location}` : ""
        let timeStr = ""
        if (event.start?.dateTime) {
          const d = new Date(event.start.dateTime)
          const h = d.getHours(), m = String(d.getMinutes()).padStart(2, "0")
          const ampm = h >= 12 ? (isArabic ? "م" : "PM") : isArabic ? "ص" : "AM"
          timeStr = ` · ${h % 12 === 0 ? 12 : h % 12}:${m} ${ampm}`
        }

        const message = isArabic
          ? `⏰ تذكير: *${title}* يبدأ خلال 30 دقيقة${timeStr}${loc}\n\nمن تقويم Google الخاص بك.`
          : `⏰ Reminder: *${title}* starts in 30 minutes${timeStr}${loc}\n\nFrom your Google Calendar.`

        await sendWhatsAppMessage(profile.phone_number, message)

        // Record that we sent this reminder
        await supabase.from("gcal_sent_reminders").upsert({ user_id: profile.id, event_id: event.id, reminded_at: new Date().toISOString() }, { onConflict: "user_id,event_id" })

        sent++
      }
    } catch (err) {
      console.error(`[Cron/GcalReminders] failed for user ${profile.id}:`, err)
    }
  }

  // Cleanup old reminder records older than 7 days
  await supabase.from("gcal_sent_reminders").delete().lt("reminded_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  return NextResponse.json({ sent })
}
