import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false })

    const { referralCode } = await req.json()
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
