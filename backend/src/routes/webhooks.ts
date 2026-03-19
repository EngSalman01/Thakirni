import { createRouter } from "../lib/types.js"
import { Hono } from "hono"
import { getServiceSupabase } from "../lib/supabase.js"
import { syncSubscriptionToProfile } from "../services/subscription.service.js"
import crypto from "crypto"

export const webhooksRouter = createRouter()

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

/** POST /api/webhooks/paddle */
webhooksRouter.post("/paddle", async (c) => {
  try {
    const body = await c.req.text()
    const signature = c.req.header("paddle-signature") ?? ""

    if (!verifyPaddleSignature(body, signature)) {
      console.error("[Paddle Webhook] Invalid signature")
      return c.json({ error: "Invalid signature" }, 401)
    }

    const payload = JSON.parse(body) as {
      type: string
      data: {
        id?: string
        customer_id?: string
        subscription_id?: string
        status?: string
        next_billed_at?: string
        paused_at?: string
        canceled_at?: string
        items?: Array<{ price?: { id: string } }>
        custom_data?: { user_id?: string }
      }
    }

    const service = getServiceSupabase()
    const eventType = payload.type
    const d = payload.data

    console.log("[Paddle Webhook] Event:", eventType)

    const priceId = d.items?.[0]?.price?.id ?? ""
    const planTier = getPlanTierFromPriceId(priceId)
    const billingCycle = getBillingCycle(priceId)

    switch (eventType) {
      case "subscription.created":
      case "subscription.activated": {
        const customerId = d.customer_id
        if (!customerId) break

        // Find user by paddle_customer_id
        let { data: profile } = await service
          .from("profiles")
          .select("id")
          .eq("paddle_customer_id", customerId)
          .single()

        // Fallback: use custom_data.user_id
        if (!profile && d.custom_data?.user_id) {
          const { data: p } = await service
            .from("profiles")
            .select("id")
            .eq("id", d.custom_data.user_id)
            .single()
          profile = p
        }

        if (!profile) {
          console.error("[Paddle Webhook] No user for customer:", customerId)
          break
        }

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

        // Update profile plan tier
        await syncSubscriptionToProfile(profile.id, priceId, "active")
        break
      }

      case "subscription.updated": {
        if (!d.id) break
        const { data: sub } = await service
          .from("subscriptions")
          .select("user_id")
          .eq("paddle_subscription_id", d.id)
          .single()

        await service
          .from("subscriptions")
          .update({
            status: d.status ?? "active",
            next_billing_date: d.next_billed_at ?? null,
            cancel_at_period_end: !!d.paused_at,
            plan_tier: planTier,
            billing_cycle: billingCycle,
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", d.id)

        if (sub?.user_id) {
          await syncSubscriptionToProfile(sub.user_id, priceId, d.status ?? "active")
        }
        break
      }

      case "subscription.canceled":
      case "subscription.cancelled": {
        if (!d.id) break
        const { data: sub } = await service
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_subscription_id", d.id)
          .select("user_id")
          .single()

        if (sub?.user_id) {
          await syncSubscriptionToProfile(sub.user_id, "", "cancelled")
        }
        break
      }

      case "transaction.completed":
        console.log("[Paddle Webhook] Transaction completed:", d.id)
        break

      default:
        console.log("[Paddle Webhook] Unhandled event:", eventType)
    }

    return c.json({ success: true })
  } catch (err) {
    console.error("[Paddle Webhook] Error:", err)
    return c.json({ error: "Internal error" }, 500)
  }
})

/** POST /api/webhooks/whatsapp */
webhooksRouter.post("/whatsapp", async (c) => {
  try {
    const body = await c.req.json() as Record<string, unknown>
    console.log("[WhatsApp Webhook] Received:", JSON.stringify(body).slice(0, 200))
    // WhatsApp webhook handling would go here
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: "Internal error" }, 500)
  }
})

/** GET /api/webhooks/whatsapp — verification handshake */
webhooksRouter.get("/whatsapp", (c) => {
  const mode = c.req.query("hub.mode")
  const token = c.req.query("hub.verify_token")
  const challenge = c.req.query("hub.challenge")

  if (mode === "subscribe" && token === process.env.KAPSO_WEBHOOK_SECRET) {
    return c.text(challenge ?? "")
  }
  return c.json({ error: "Forbidden" }, 403)
})
