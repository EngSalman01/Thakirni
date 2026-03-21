import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { syncSubscriptionToProfile } from "@/lib/services/subscription.service"
import crypto from "crypto"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyPaddleSignature(body: string, signature: string): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? ""
  const hash = crypto.createHmac("sha256", secret).update(body).digest("hex")
  return hash === signature
}

function getPlanTierFromPriceId(priceId: string): string {
  const p = priceId.toLowerCase()
  if (p.includes("team") || p === process.env.PADDLE_PRICE_TEAMS_MONTHLY || p === process.env.PADDLE_PRICE_TEAMS_ANNUAL) return "TEAMS"
  if (p.includes("pro") || p === process.env.PADDLE_PRICE_PRO_MONTHLY || p === process.env.PADDLE_PRICE_PRO_ANNUAL) return "PRO"
  return "FREE"
}

function getBillingCycle(priceId: string): "monthly" | "annual" {
  return priceId.toLowerCase().includes("annual") ? "annual" : "monthly"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("paddle-signature") ?? ""

    if (!verifyPaddleSignature(body, signature)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload = JSON.parse(body) as {
      type: string
      data: {
        id?: string
        customer_id?: string
        status?: string
        next_billed_at?: string
        paused_at?: string
        items?: Array<{ price?: { id: string } }>
        custom_data?: { user_id?: string }
      }
    }

    const service = getServiceSupabase()
    const eventType = payload.type
    const d = payload.data
    const priceId = d.items?.[0]?.price?.id ?? ""
    const planTier = getPlanTierFromPriceId(priceId)
    const billingCycle = getBillingCycle(priceId)

    switch (eventType) {
      case "subscription.created":
      case "subscription.activated": {
        const customerId = d.customer_id
        if (!customerId) break

        let { data: profile } = await service.from("profiles").select("id").eq("paddle_customer_id", customerId).single()

        if (!profile && d.custom_data?.user_id) {
          const { data: p } = await service.from("profiles").select("id").eq("id", d.custom_data.user_id).single()
          profile = p
        }

        if (!profile) break

        await service.from("subscriptions").upsert({
          user_id: profile.id,
          paddle_subscription_id: d.id,
          paddle_customer_id: customerId,
          plan_tier: planTier,
          billing_cycle: billingCycle,
          status: "active",
          next_billing_date: d.next_billed_at ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "paddle_subscription_id" })

        await syncSubscriptionToProfile(profile.id, priceId, "active")
        break
      }

      case "subscription.updated": {
        if (!d.id) break
        const { data: sub } = await service.from("subscriptions").select("user_id").eq("paddle_subscription_id", d.id).single()

        await service.from("subscriptions").update({
          status: d.status ?? "active",
          next_billing_date: d.next_billed_at ?? null,
          cancel_at_period_end: !!d.paused_at,
          plan_tier: planTier,
          billing_cycle: billingCycle,
          updated_at: new Date().toISOString(),
        }).eq("paddle_subscription_id", d.id)

        if (sub?.user_id) await syncSubscriptionToProfile(sub.user_id, priceId, d.status ?? "active")
        break
      }

      case "subscription.canceled":
      case "subscription.cancelled": {
        if (!d.id) break
        const { data: sub } = await service.from("subscriptions").update({
          status: "cancelled",
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        }).eq("paddle_subscription_id", d.id).select("user_id").single()

        if (sub?.user_id) await syncSubscriptionToProfile(sub.user_id, "", "cancelled")
        break
      }
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error("[Paddle Webhook] Error:", err)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
