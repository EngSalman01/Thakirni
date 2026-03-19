import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID ?? ""
const APP_URL              = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const REDIRECT_URI         = `${APP_URL}/api/google-calendar/callback`
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
].join(" ")

export async function GET(req: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google Client ID not configured" }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${APP_URL}/auth`)
  }

  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         SCOPES,
    access_type:   "offline",
    prompt:        "consent",
    state:         user.id,   // use user id as CSRF state
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
