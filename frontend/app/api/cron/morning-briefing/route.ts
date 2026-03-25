import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

interface GCalEvent {
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  location?: string
}

interface GCalResponse {
  items?: GCalEvent[]
}

interface Profile {
  id: string
  full_name: string | null
  phone_number: string
  preferred_language: string | null
  google_calendar_token: string | null
  google_calendar_refresh_token: string | null
  google_calendar_expires_at: string | null
}

interface Plan {
  title: string
  plan_time: string | null
  location: string | null
  category: string
}

async function refreshGCalToken(
  supabase: ReturnType<typeof createServiceClient>,
  profile: Profile,
): Promise<string | null> {
  if (!profile.google_calendar_refresh_token) return null

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: profile.google_calendar_refresh_token,
        grant_type: "refresh_token",
      }),
    })

    if (!res.ok) {
      console.error("[Cron/MorningBriefing] GCal token refresh failed:", res.status)
      return null
    }

    const data = await res.json()
    const newToken: string = data.access_token
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()

    await supabase
      .from("profiles")
      .update({
        google_calendar_token: newToken,
        google_calendar_expires_at: expiresAt,
      })
      .eq("id", profile.id)

    return newToken
  } catch (err) {
    console.error("[Cron/MorningBriefing] GCal token refresh error:", err)
    return null
  }
}

async function fetchGCalEvents(
  supabase: ReturnType<typeof createServiceClient>,
  profile: Profile,
  timeMin: string,
  timeMax: string,
): Promise<GCalEvent[]> {
  if (!profile.google_calendar_token) return []

  let token = profile.google_calendar_token

  // Refresh if expired
  if (profile.google_calendar_expires_at) {
    const expiresAt = new Date(profile.google_calendar_expires_at).getTime()
    if (expiresAt < Date.now()) {
      const refreshed = await refreshGCalToken(supabase, profile)
      if (!refreshed) return []
      token = refreshed
    }
  }

  try {
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events")
    url.searchParams.set("timeMin", timeMin)
    url.searchParams.set("timeMax", timeMax)
    url.searchParams.set("singleEvents", "true")
    url.searchParams.set("orderBy", "startTime")

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      console.error("[Cron/MorningBriefing] GCal fetch failed:", res.status)
      return []
    }

    const data: GCalResponse = await res.json()
    return data.items ?? []
  } catch (err) {
    console.error("[Cron/MorningBriefing] GCal fetch error:", err)
    return []
  }
}

function formatPlanLine(plan: Plan, isArabic: boolean): string {
  if (plan.plan_time) {
    const timeParts = plan.plan_time.split(":")
    const hour = parseInt(timeParts[0], 10)
    const minute = timeParts[1] ?? "00"
    const ampm = hour >= 12 ? (isArabic ? "م" : "PM") : isArabic ? "ص" : "AM"
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    const timeStr = `${displayHour}:${minute} ${ampm}`
    const loc = plan.location ? ` - ${plan.location}` : ""
    return `📅 ${timeStr} ${plan.title}${loc}`
  }
  return `✅ ${plan.title}`
}

function formatGCalLine(event: GCalEvent, isArabic: boolean): string {
  const title = event.summary ?? (isArabic ? "حدث" : "Event")
  const loc = event.location ? ` - ${event.location}` : ""

  if (event.start?.dateTime) {
    const date = new Date(event.start.dateTime)
    const hour = date.getHours()
    const minute = String(date.getMinutes()).padStart(2, "0")
    const ampm = hour >= 12 ? (isArabic ? "م" : "PM") : isArabic ? "ص" : "AM"
    const displayHour = hour % 12 === 0 ? 12 : hour % 12
    const timeStr = `${displayHour}:${minute} ${ampm}`
    return `📅 ${timeStr} ${title}${loc}`
  }

  return `📅 ${title}${loc}`
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader?.toLowerCase() !== `bearer ${process.env.CRON_SECRET?.toLowerCase()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Get current Riyadh date boundaries
  const now = new Date()
  const riyadhDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }) // YYYY-MM-DD
  const timeMin = new Date(`${riyadhDateStr}T00:00:00+03:00`).toISOString()
  const timeMax = new Date(`${riyadhDateStr}T23:59:59+03:00`).toISOString()

  // Fetch all users with a phone number
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, preferred_language, google_calendar_token, google_calendar_refresh_token, google_calendar_expires_at")
    .not("phone_number", "is", null)

  if (profilesError) {
    console.error("[Cron/MorningBriefing] profiles fetch error:", profilesError.message)
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 })
  }

  let sent = 0
  let skipped = 0

  for (const profile of profiles as Profile[]) {
    try {
      // Fetch today's pending plans
      const { data: plans } = await supabase
        .from("plans")
        .select("title, plan_time, location, category")
        .eq("user_id", profile.id)
        .eq("plan_date", riyadhDateStr)
        .eq("status", "pending")
        .order("plan_time", { ascending: true, nullsFirst: false })

      const todayPlans: Plan[] = plans ?? []

      // Fetch Google Calendar events if connected
      const gcalEvents = await fetchGCalEvents(supabase, profile, timeMin, timeMax)

      // Skip if nothing scheduled
      if (todayPlans.length === 0 && gcalEvents.length === 0) {
        skipped++
        continue
      }

      const isArabic = (profile.preferred_language ?? "ar") !== "en"
      const name = profile.full_name ?? (isArabic ? "صديقي" : "there")

      const planLines = todayPlans.map((p) => formatPlanLine(p, isArabic))
      const gcalLines = gcalEvents.map((e) => formatGCalLine(e, isArabic))
      const allLines = [...planLines, ...gcalLines]

      let message: string
      if (isArabic) {
        message = `صباح الخير ${name}! 🌅\n\nيومك اليوم:\n${allLines.join("\n")}\n\nيوم مبارك! 😊`
      } else {
        message = `Good morning ${name}! 🌅\n\nYour day:\n${allLines.join("\n")}\n\nHave a great day! 😊`
      }

      await sendWhatsAppMessage(profile.phone_number, message)
      sent++
    } catch (err) {
      console.error(`[Cron/MorningBriefing] failed for user ${profile.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
