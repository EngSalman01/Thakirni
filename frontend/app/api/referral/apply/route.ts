import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"
import { parseBody, sanitizeString, getClientIp } from "@/lib/validate"

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = await limiters.form(ip)
  if (!rl.success) return rateLimitResponse(rl.reset)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false })

    const [body, parseErr] = await parseBody<Record<string, unknown>>(req, 2048)
    if (parseErr) return NextResponse.json({ ok: false })

    const referralCode = sanitizeString(body.referralCode, 50)
    if (!referralCode) return NextResponse.json({ ok: false })

    await supabase.rpc("apply_referral_reward", {
      p_referred_id: user.id,
      p_referral_code: referralCode,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
