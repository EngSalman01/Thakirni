import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  const nextRaw = searchParams.get("next") ?? "/vault"
  // Allow relative paths only — prevent open redirect via external URLs
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/vault"

  if (code) {
    // Build the redirect response first so we can attach cookies to it directly.
    // Using createClient() (next/headers) would set cookies on a separate response
    // object that is NOT the redirect response, so the session would be lost.
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Send welcome email for brand-new Google signups (created_at ≈ now)
      const createdAt = new Date(data.user.created_at).getTime()
      const isNew = Date.now() - createdAt < 30_000 // within last 30 seconds

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

      return response
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=callback_failed`)
}
