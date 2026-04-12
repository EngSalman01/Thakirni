import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createPaddleServerClient } from "@/lib/paddle/server"

const PRICE_IDS: Record<string, string | undefined> = {
  student: process.env.PADDLE_PRICE_STUDENT_MONTHLY,
  pro: process.env.PADDLE_PRICE_PRO_MONTHLY || process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY,
  teams: process.env.PADDLE_PRICE_TEAMS_MONTHLY || process.env.NEXT_PUBLIC_PADDLE_PRICE_TEAMS_MONTHLY,
}

/**
 * POST /api/paddle/checkout-url
 * Body: { plan: "student" | "pro" | "teams", discountCode?: string }
 * Returns: { url: string }
 *
 * Creates a Paddle hosted-page transaction and returns the checkout URL.
 * This bypasses Paddle.js SDK entirely — always works.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { plan, discountCode } = await req.json() as { plan: string; discountCode?: string }
  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    console.error(`[checkout-url] No price ID for plan=${plan}. Env vars:`, Object.keys(process.env).filter(k => k.includes("PADDLE_PRICE")))
    return NextResponse.json({ error: `Price not configured for plan: ${plan}` }, { status: 422 })
  }

  let paddle
  try {
    paddle = createPaddleServerClient()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Paddle is not configured correctly."
    console.error("[checkout-url] Paddle configuration error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  try {
    // Fetch user profile for email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, phone")
      .eq("id", user.id)
      .single()
    const email = profile?.email || user.email || ""

    const txBody: Record<string, unknown> = {
      items: [{ priceId, quantity: 1 }],
      checkoutSettings: {
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://thakirni.com"}/vault/settings?checkout=success&plan=${plan}`,
      },
    }

    if (email) {
      (txBody as any).customer = { email }
    }

    if (discountCode) {
      (txBody as any).discountCode = discountCode
    }

    const transaction = await (paddle.transactions as any).create(txBody)
    const checkoutUrl = (transaction as any)?.checkout?.url

    if (!checkoutUrl) {
      console.error("[checkout-url] No checkout URL in response:", JSON.stringify(transaction).slice(0, 400))
      return NextResponse.json({ error: "Paddle did not return a checkout URL" }, { status: 500 })
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (err: any) {
    console.error("[checkout-url] Paddle error:", err?.message || err)
    return NextResponse.json({ error: err?.message || "Paddle checkout failed" }, { status: 500 })
  }
}
