import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID ?? ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ""
const APP_URL              = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const REDIRECT_URI         = `${APP_URL}/api/google-calendar/callback`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get("code")
  const state = searchParams.get("state")   // user id
  const error = searchParams.get("error")

  if (error || !code || !state) {
    return NextResponse.redirect(`${APP_URL}/vault/settings?calendar=error`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${APP_URL}/vault/settings?calendar=error`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  // Store tokens in Supabase profile
  const supabase = await createClient()
  await supabase
    .from("profiles")
    .update({
      google_calendar_token:          tokens.access_token,
      google_calendar_refresh_token:  tokens.refresh_token ?? null,
      google_calendar_expires_at:     expiresAt,
      updated_at:                     new Date().toISOString(),
    })
    .eq("id", state)

  return NextResponse.redirect(`${APP_URL}/vault/settings?calendar=connected`)
}
