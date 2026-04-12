/**
 * Credits purchase — creates a Paddle one-time checkout for a credits pack.
 *
 * After successful payment, the Paddle webhook (`transaction.completed`)
 * detects `custom_data.type === "credits"` and adds credits to the user.
 *
 * Available packs (configured via env vars):
 *   PADDLE_PRICE_CREDITS_50   — 50 credits (small)
 *   PADDLE_PRICE_CREDITS_200  — 200 credits (medium)
 *   PADDLE_PRICE_CREDITS_500  — 500 credits (large)
 *
 * If price IDs aren't configured yet, returns instructions for admin to set them up.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPaddleServerClient } from "@/lib/paddle/server"
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit"

const CREDIT_PACKS = [
  { id: "small",  credits: 50,  priceEnv: "PADDLE_PRICE_CREDITS_50",  labelAr: "٥٠ رسالة",  labelEn: "50 messages" },
  { id: "medium", credits: 200, priceEnv: "PADDLE_PRICE_CREDITS_200", labelAr: "٢٠٠ رسالة", labelEn: "200 messages" },
  { id: "large",  credits: 500, priceEnv: "PADDLE_PRICE_CREDITS_500", labelAr: "٥٠٠ رسالة", labelEn: "500 messages" },
]

function getPaddleClient() {
  return createPaddleServerClient()
}

/** GET: list available credit packs */
export async function GET() {
  const packs = CREDIT_PACKS.map(p => ({
    id: p.id,
    credits: p.credits,
    labelAr: p.labelAr,
    labelEn: p.labelEn,
    priceId: process.env[p.priceEnv] ?? null,
    configured: !!process.env[p.priceEnv],
  }))
  return NextResponse.json({ packs })
}

/** POST: create Paddle checkout for a credits pack */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Prevent payment-spam: 10 checkout attempts per hour per user
    const rl = await rateLimit(`credits_purchase:${user.id}`, 10, 3_600_000)
    if (!rl.success) return rateLimitResponse(rl.reset)

    const body = await req.json().catch(() => ({})) as { pack?: unknown }
    const { pack } = body
    const packConfig = CREDIT_PACKS.find(p => p.id === String(pack ?? ""))
    if (!packConfig) return NextResponse.json({ error: "Invalid pack" }, { status: 400 })

    const priceId = process.env[packConfig.priceEnv]
    if (!priceId) {
      // Price not configured yet — return instructions
      return NextResponse.json({
        error: "credits_not_configured",
        message: `Create a Paddle one-time price and set ${packConfig.priceEnv} in your environment.`,
      }, { status: 503 })
    }

    const paddle = getPaddleClient()
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://thakirni.com"

    // Create Paddle transaction with custom_data so the webhook knows it's a credits purchase
    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: {
        user_id: user.id,
        type: "credits",
        credits_amount: packConfig.credits,
      } as Record<string, string | number>,
      checkout: {
        url: `${origin}/vault?credits_success=1`,
      },
    })

    const checkoutUrl = (transaction as unknown as { checkout?: { url?: string } }).checkout?.url

    if (!checkoutUrl) {
      return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
    }

    return NextResponse.json({
      checkoutUrl,
      credits: packConfig.credits,
      label: packConfig.labelEn,
    })
  } catch (err) {
    console.error("[credits/purchase]", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
