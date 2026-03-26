import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID ?? ""
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ""

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const redirectUri = `${origin}/api/google-calendar/callback`

  const code  = searchParams.get("code")
  const state = searchParams.get("state")   // user id
  const error = searchParams.get("error")

  if (error || !code || !state) {
    console.error("[gcal/callback] missing params — error:", error, "code:", !!code, "state:", !!state)
    return NextResponse.redirect(`${origin}/vault/settings?calendar=error&reason=missing_params`)
  }

  // Verify the state matches the authenticated user (prevents CSRF)
  const supabaseCheck = await createClient()
  const { data: { user: authUser } } = await supabaseCheck.auth.getUser()
  if (!authUser) {
    console.error("[gcal/callback] no authenticated user in session")
    return NextResponse.redirect(`${origin}/vault/settings?calendar=error&reason=no_session`)
  }
  if (authUser.id !== state) {
    console.error("[gcal/callback] state mismatch — authUser:", authUser.id, "state:", state)
    return NextResponse.redirect(`${origin}/vault/settings?calendar=error&reason=state_mismatch`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  redirectUri,
      grant_type:    "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.error("[gcal/callback] token exchange failed:", tokenRes.status, errBody)
    return NextResponse.redirect(`${origin}/vault/settings?calendar=error&reason=token_exchange`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  // Store tokens in Supabase profile (reuse the already-authenticated client)
  const { error: updateError } = await supabaseCheck
    .from("profiles")
    .update({
      google_calendar_token:          tokens.access_token,
      google_calendar_refresh_token:  tokens.refresh_token ?? null,
      google_calendar_expires_at:     expiresAt,
      updated_at:                     new Date().toISOString(),
    })
    .eq("id", state)

  if (updateError) {
    console.error("[google-calendar/callback] profile update error:", updateError)
    return NextResponse.redirect(`${origin}/vault/settings?calendar=error`)
  }

  return NextResponse.redirect(`${origin}/vault/settings?calendar=connected`)
}
