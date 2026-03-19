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
    return NextResponse.json({ connected: false, events: [] })
  }

  let accessToken = profile.google_calendar_token

  // Refresh token if expired or close to expiry
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

  // Fetch upcoming events (next 7 days)
  const now    = new Date().toISOString()
  const oneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const params = new URLSearchParams({
    timeMin:      now,
    timeMax:      oneWeek,
    maxResults:   "20",
    singleEvents: "true",
    orderBy:      "startTime",
  })

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!calRes.ok) {
    return NextResponse.json({ connected: true, events: [], error: "Failed to fetch events" })
  }

  const data = await calRes.json() as { items?: unknown[] }
  return NextResponse.json({ connected: true, events: data.items ?? [] })
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
