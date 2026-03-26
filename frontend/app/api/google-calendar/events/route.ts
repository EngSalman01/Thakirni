import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID ?? ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ""

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type:    "refresh_token",
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { access_token: string; expires_in: number }
    return data.access_token
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_calendar_token, google_calendar_refresh_token, google_calendar_expires_at")
    .eq("id", user.id)
    .single()

  if (!profile?.google_calendar_token) {
    console.log("[gcal/events] no token for user", user.id)
    return NextResponse.json({ connected: false, events: [] })
  }

  let accessToken = profile.google_calendar_token

  // Refresh token if expired or close to expiry
  if (profile.google_calendar_expires_at) {
    const expiresAt = new Date(profile.google_calendar_expires_at).getTime()
    if (Date.now() > expiresAt - 60_000) {
      if (profile.google_calendar_refresh_token) {
        console.log("[gcal/events] refreshing expired token for user", user.id)
        const newToken = await refreshAccessToken(profile.google_calendar_refresh_token)
        if (newToken) {
          accessToken = newToken
          const newExpiry = new Date(Date.now() + 3600 * 1000).toISOString()
          await supabase
            .from("profiles")
            .update({ google_calendar_token: newToken, google_calendar_expires_at: newExpiry })
            .eq("id", user.id)
        } else {
          console.error("[gcal/events] token refresh failed for user", user.id)
          return NextResponse.json({ connected: false, events: [], error: "token_expired" })
        }
      } else {
        console.error("[gcal/events] no refresh token for user", user.id)
        return NextResponse.json({ connected: false, events: [], error: "no_refresh_token" })
      }
    }
  }

  const headers = { Authorization: `Bearer ${accessToken}` }

  // Fetch all calendars the user has
  const calListRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50",
    { headers }
  )
  if (!calListRes.ok) {
    const body = await calListRes.text()
    console.error("[gcal/events] calendarList failed:", calListRes.status, body)
    return NextResponse.json({ connected: true, events: [], error: "Failed to fetch calendar list" })
  }

  interface CalendarListEntry {
    id: string
    summary: string
    backgroundColor?: string
    selected?: boolean
    accessRole?: string
  }
  const calList = await calListRes.json() as { items?: CalendarListEntry[] }
  const calendars = (calList.items ?? []).filter(c => c.selected !== false)
  console.log("[gcal/events] fetching from", calendars.length, "calendars for user", user.id)

  // Fetch events from start of today through next 60 days
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  const qp = new URLSearchParams({
    timeMin:      todayStart.toISOString(),
    timeMax:      in60Days,
    maxResults:   "50",
    singleEvents: "true",
    orderBy:      "startTime",
  })

  const eventResults = await Promise.allSettled(
    calendars.map(cal =>
      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${qp}`,
        { headers }
      )
        .then(r => r.ok ? r.json() : Promise.resolve({ items: [] }))
        .then((data: { items?: Record<string, unknown>[] }) =>
          (data.items ?? []).map(ev => ({
            ...ev,
            _calendarName:  cal.summary,
            _calendarColor: cal.backgroundColor ?? "#4285F4",
          }))
        )
    )
  )

  type CalEvent = Record<string, unknown> & { _calendarName: string; _calendarColor: string }
  const allEvents = (eventResults.flatMap(r => r.status === "fulfilled" ? r.value : []) as CalEvent[])
    .sort((a, b) => {
      const aStart = (a.start as Record<string, string> | undefined)?.dateTime ?? (a.start as Record<string, string> | undefined)?.date ?? ""
      const bStart = (b.start as Record<string, string> | undefined)?.dateTime ?? (b.start as Record<string, string> | undefined)?.date ?? ""
      return aStart.localeCompare(bStart)
    })

  console.log("[gcal/events] returning", allEvents.length, "events for user", user.id)
  return NextResponse.json({ connected: true, events: allEvents })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as { title: string; date?: string; description?: string }
  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("google_calendar_token, google_calendar_refresh_token, google_calendar_expires_at")
    .eq("id", user.id)
    .single()

  if (!profile?.google_calendar_token) {
    return NextResponse.json({ error: "Google Calendar not connected" }, { status: 403 })
  }

  let accessToken = profile.google_calendar_token

  if (profile.google_calendar_expires_at) {
    const expiresAt = new Date(profile.google_calendar_expires_at).getTime()
    if (Date.now() > expiresAt - 60_000 && profile.google_calendar_refresh_token) {
      const newToken = await refreshAccessToken(profile.google_calendar_refresh_token)
      if (newToken) {
        accessToken = newToken
        const newExpiry = new Date(Date.now() + 3600 * 1000).toISOString()
        await supabase
          .from("profiles")
          .update({ google_calendar_token: newToken, google_calendar_expires_at: newExpiry })
          .eq("id", user.id)
      }
    }
  }

  // Build start/end — if date has a time component use dateTime, else use all-day date
  const hasTime = body.date?.includes("T") ?? false
  const startDate = body.date ? new Date(body.date) : new Date()
  const endDate   = new Date(startDate.getTime() + 60 * 60 * 1000)

  const event = {
    summary:     body.title,
    description: body.description ?? "",
    start: hasTime
      ? { dateTime: startDate.toISOString(), timeZone: "UTC" }
      : { date: (body.date ?? startDate.toISOString()).split("T")[0] },
    end: hasTime
      ? { dateTime: endDate.toISOString(), timeZone: "UTC" }
      : { date: (body.date ?? startDate.toISOString()).split("T")[0] },
  }

  const calRes = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }
  )

  if (!calRes.ok) {
    const errText = await calRes.text()
    console.error("[google-calendar/events] create error:", errText)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }

  const created = await calRes.json() as { id: string; htmlLink: string }
  return NextResponse.json({ event: created })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await supabase
    .from("profiles")
    .update({
      google_calendar_token:         null,
      google_calendar_refresh_token: null,
      google_calendar_expires_at:    null,
    })
    .eq("id", user.id)

  return NextResponse.json({ disconnected: true })
}
