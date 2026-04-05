/**
 * Referral share API — returns personalized share message + link.
 * Used by in-app share button and WhatsApp share CTA.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildShareMessageAr, buildShareMessageEn, getReferralLink } from "@/lib/growth/viral"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code, full_name, preferred_language")
    .eq("id", user.id)
    .single()

  if (!profile?.referral_code) {
    return NextResponse.json({ error: "No referral code" }, { status: 404 })
  }

  const isArabic = (profile.preferred_language ?? "ar") !== "en"
  const firstName = (profile.full_name ?? "").split(" ")[0] || undefined

  const link = getReferralLink(profile.referral_code)
  const message = isArabic
    ? buildShareMessageAr(profile.referral_code, firstName)
    : buildShareMessageEn(profile.referral_code)

  // Count how many referred users
  const { count } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id)

  // Log that user viewed share (intent signal)
  supabase.from("analytics_events").insert({
    user_id: user.id,
    event_name: "referral_link_copied",
    properties: { source: "share_api" },
  }).then(undefined, () => {})

  return NextResponse.json({
    code: profile.referral_code,
    link,
    message,
    referralCount: count ?? 0,
    reward: { credits: 50, description: isArabic ? "٥٠ رصيد لك ولصاحبك" : "50 credits for you & your friend" },
  })
}
