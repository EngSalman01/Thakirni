import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code  = searchParams.get("code")
  const type  = searchParams.get("type") ?? ""         // signup | email_change | recovery | invite | magiclink
  const nextRaw = searchParams.get("next") ?? "/vault"
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/vault"

  const oauthError     = searchParams.get("error")
  const oauthErrorDesc = searchParams.get("error_description")
  if (oauthError) {
    console.error("[auth/callback] OAuth error:", oauthError, oauthErrorDesc)
    return NextResponse.redirect(
      `${origin}/auth?error=invalid_link&reason=${encodeURIComponent(oauthErrorDesc ?? oauthError)}`
    )
  }

  // Map Supabase auth type to toast key
  function toastForType(t: string): string {
    if (t === "signup" || t === "email")    return "email_verified"
    if (t === "invite")                     return "invite_accepted"
    if (t === "recovery")                   return "password_updated"
    if (t === "email_change")               return "email_updated"
    return ""
  }

  if (code) {
    const response = NextResponse.redirect(`${origin}/vault`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message)
      return NextResponse.redirect(
        `${origin}/auth?error=invalid_link&reason=${encodeURIComponent(error.message)}`
      )
    }

    if (data.user) {
      // Determine toast param
      let toast = toastForType(type)

      // New Google OAuth signup (created within last 30s)
      const createdAt = new Date(data.user.created_at).getTime()
      const isNew = Date.now() - createdAt < 30_000
      if (!toast && isNew) toast = "email_verified"

      if (isNew) {
        fetch(`${origin}/api/auth/welcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.user.email,
            name: data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0],
          }),
        }).catch((e) => console.error("[auth/callback] welcome email error:", e))
      }

      // Build destination
      const dest = toast
        ? `${origin}/vault?toast=${toast}`
        : type === "magiclink"
          ? `${origin}/vault`
          : `${origin}${next}`

      // Update the redirect URL on the already-built response
      return NextResponse.redirect(dest, { headers: response.headers })
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=invalid_link`)
}
