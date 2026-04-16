import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"

// GET /api/affiliate — get current user's affiliate info
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!affiliate) return NextResponse.json({ affiliate: null })

  // Get recent conversions
  const { data: conversions } = await supabase
    .from("affiliate_conversions")
    .select("id, plan_purchased, revenue, commission, status, created_at")
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return NextResponse.json({
    affiliate,
    conversions: conversions ?? [],
    link: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://thakirni.com"}/?aff=${affiliate.code}`,
  })
}

// POST /api/affiliate — apply to become an affiliate
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rl = await limiters.api(user.id)
  if (!rl.success) return rateLimitResponse(rl.reset)

  // Check if already an affiliate
  const { data: existing } = await supabase
    .from("affiliates")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (existing) return NextResponse.json({ error: "Already enrolled as affiliate" }, { status: 409 })

  const body = await req.json().catch(() => ({}))
  const payoutEmail = String(body.payout_email ?? "").trim()

  // Generate unique affiliate code from user name or email
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  const baseName = (profile?.full_name ?? user.email?.split("@")[0] ?? "aff")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8)
  const code = `${baseName}${Math.floor(1000 + Math.random() * 9000)}`

  const { data: affiliate, error } = await supabase
    .from("affiliates")
    .insert({
      user_id:         user.id,
      code,
      commission_rate: 20.00,
      payout_email:    payoutEmail || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    affiliate,
    link: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://thakirni.com"}/?aff=${code}`,
  })
}
