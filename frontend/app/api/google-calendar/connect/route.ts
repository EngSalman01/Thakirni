import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ""
const SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ")

export async function GET(req: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google Client ID not configured" }, { status: 500 })
  }

  const { origin } = new URL(req.url)
  const redirectUri = `${origin}/api/google-calendar/callback`

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/auth`)
  }

  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         SCOPES,
    access_type:   "offline",
    prompt:        "consent",
    state:         user.id,
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
