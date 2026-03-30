import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("profiles")
    .select("referral_code, full_name")
    .eq("id", user.id)
    .single()

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth?ref=${data?.referral_code}`

  // Count referrals made
  const { count } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id)

  return NextResponse.json({
    code: data?.referral_code,
    link: referralLink,
    count: count ?? 0,
  })
}
