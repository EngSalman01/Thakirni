import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

export const maxDuration = 30

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifySignature(body: string, header: string): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? ""
  if (!secret) return false

  // Paddle uses "ts=xxx;h1=yyy" format
  const parts = Object.fromEntries(
    header.split(";").map((p) => p.split("=") as [string, string])
  )
  const ts = parts["ts"]
  const h1 = parts["h1"]
  if (!ts || !h1) return false

  const signed = `${ts}:${body}`
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signed)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(h1, "hex")
  )
}

function getPlanTierFromPriceId(priceId: string): "FREE" | "PRO" | "TEAMS" {
  const p = priceId.toLowerCase()
  if (p.includes("team") || p === process.env.PADDLE_PRICE_TEAMS_MONTHLY || p === process.env.PADDLE_PRICE_TEAMS_ANNUAL) return "TEAMS"
  if (p.includes("pro")  || p === process.env.PADDLE_PRICE_PRO_MONTHLY  || p === process.env.PADDLE_PRICE_PRO_ANNUAL)  return "PRO"
  return "FREE"
}

type EventPayload = {
  event_type: string
  data: {
    id?: string
    customer_id?: string
    status?: string
    next_billed_at?: string
    paused_at?: string
    canceled_at?: string
    current_billing_period?: { ends_at?: string }
    items?: Array<{ price?: { id: string } }>
    custom_data?: { user_id?: string }
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("paddle-signature") ?? ""

  if (!verifySignature(rawBody, signature)) {
    console.error("[Paddle Webhook] Invalid signature")
    return Response.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: EventPayload
  try {
    payload = JSON.parse(rawBody) as EventPayload
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const service = getServiceSupabase()
  const { event_type, data } = payload

  console.log("[Paddle Webhook] Event:", event_type)

  const priceId = data.items?.[0]?.price?.id ?? ""
  const planTier = getPlanTierFromPriceId(priceId)
  const currentPeriodEnd = data.current_billing_period?.ends_at ?? data.next_billed_at ?? null

  try {
    switch (event_type) {
      case "subscription.created":
      case "subscription.activated": {
        const customerId = data.customer_id
        if (!customerId) break

        // Find user
        let { data: profile } = await service
          .from("profiles")
          .select("id")
          .eq("paddle_customer_id", customerId)
          .single()

        if (!profile && data.custom_data?.user_id) {
          const { data: p } = await service
            .from("profiles")
            .select("id")
            .eq("id", data.custom_data.user_id)
            .single()
          profile = p
        }

        if (!profile) {
          console.error("[Paddle Webhook] No profile for customer:", customerId)
          break
        }

        // Upsert subscription
        await service.from("subscriptions").upsert({
          user_id: profile.id,
          paddle_subscription_id: data.id,
          paddle_customer_id: customerId,
          plan_tier: planTier,
          status: "active",
          next_billing_date: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: "paddle_subscription_id" })

        // Update profile plan tier (SINGLE SOURCE OF TRUTH)
        await service
          .from("profiles")
          .update({
            plan_tier: planTier,
            paddle_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id)

        console.log("[Paddle Webhook] Activated:", planTier, "for user:", profile.id)
        break
      }

      case "subscription.updated": {
        if (!data.id) break

        const { data: sub } = await service
          .from("subscriptions")
          .select("user_id")
          .eq("paddle_subscription_id", data.id)
          .single()

        if (!sub?.user_id) break

        await service
          .from("subscriptions")
          .update({
            status: data.status ?? "active",
            plan_tier: planTier,
            next_billing_date: currentPeriodEnd,
            cancel_at_period_end: !!data.paused_at,
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", data.id)

        await service
          .from("profiles")
          .update({ plan_tier: planTier, updated_at: new Date().toISOString() })
          .eq("id", sub.user_id)

        console.log("[Paddle Webhook] Updated:", planTier, "for user:", sub.user_id)
        break
      }

      case "subscription.canceled":
      case "subscription.cancelled": {
        if (!data.id) break

        const { data: sub } = await service
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", data.id)
          .select("user_id")
          .single()

        if (sub?.user_id) {
          await service
            .from("profiles")
            .update({ plan_tier: "FREE", updated_at: new Date().toISOString() })
            .eq("id", sub.user_id)

          console.log("[Paddle Webhook] Cancelled for user:", sub.user_id)
        }
        break
      }

      case "transaction.completed":
        console.log("[Paddle Webhook] Transaction completed:", data.id)
        break

      default:
        console.log("[Paddle Webhook] Unhandled event:", event_type)
    }
  } catch (err) {
    console.error("[Paddle Webhook] DB error:", err)
    // Return 200 to prevent Paddle from retrying — log the error separately
  }

  return Response.json({ received: true })
}
