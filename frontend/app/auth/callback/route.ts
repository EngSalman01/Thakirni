import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  const nextRaw = searchParams.get("next") ?? "/vault"
  // Allow relative paths only — prevent open redirect via external URLs
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/vault"

  if (code) {
    const supabase = await createClient()
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
        }).catch(() => {})
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=callback_failed`)
}
