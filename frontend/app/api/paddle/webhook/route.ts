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

  const parts = Object.fromEntries(
    header.split(";").map((p) => p.split("=") as [string, string])
  )
  const ts = parts["ts"]
  const h1 = parts["h1"]
  if (!ts || !h1) return false

  const signed = `${ts}:${body}`
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(h1, "hex")
  )
}

function getPlanTierFromPriceId(priceId: string): "FREE" | "INDIVIDUAL" | "COMPANY" {
  const p = priceId.toLowerCase()
  if (p.includes("company") || p.includes("team") ||
      p === process.env.PADDLE_PRICE_TEAMS_MONTHLY ||
      p === process.env.PADDLE_PRICE_TEAMS_ANNUAL) return "COMPANY"
  if (p.includes("individual") || p.includes("pro") ||
      p === process.env.PADDLE_PRICE_PRO_MONTHLY ||
      p === process.env.PADDLE_PRICE_PRO_ANNUAL)  return "INDIVIDUAL"
  return "FREE"
}

/** Resolve the personal workspace for a user — used to link billing to workspace. */
async function getPersonalWorkspaceId(
  service: ReturnType<typeof getServiceSupabase>,
  userId: string
): Promise<string | null> {
  const { data } = await service
    .from("workspaces")
    .select("id")
    .eq("type", "personal")
    .eq("owner_id", userId)
    .single()
  return data?.id ?? null
}

/** Upsert workspace_billing row alongside profile/subscription updates. */
async function syncWorkspaceBilling(
  service: ReturnType<typeof getServiceSupabase>,
  userId: string,
  opts: {
    planTier: "FREE" | "INDIVIDUAL" | "COMPANY"
    status: "active" | "inactive" | "cancelled" | "past_due"
    paddleSubscriptionId?: string
    paddleCustomerId?: string
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
  }
) {
  const workspaceId = await getPersonalWorkspaceId(service, userId)
  if (!workspaceId) return

  await service.from("workspace_billing").upsert({
    workspace_id:           workspaceId,
    subscription_tier:      opts.planTier,
    subscription_status:    opts.status,
    paddle_subscription_id: opts.paddleSubscriptionId ?? null,
    paddle_customer_id:     opts.paddleCustomerId ?? null,
    current_period_end:     opts.currentPeriodEnd ?? null,
    cancel_at_period_end:   opts.cancelAtPeriodEnd ?? false,
    updated_at:             new Date().toISOString(),
  }, { onConflict: "workspace_id" })
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

  const priceId          = data.items?.[0]?.price?.id ?? ""
  const planTier         = getPlanTierFromPriceId(priceId)
  const currentPeriodEnd = data.current_billing_period?.ends_at ?? data.next_billed_at ?? null

  try {
    switch (event_type) {
      case "subscription.created":
      case "subscription.activated": {
        const customerId = data.customer_id
        if (!customerId) break

        // Resolve user
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

        // Upsert subscription record
        await service.from("subscriptions").upsert({
          user_id:                profile.id,
          paddle_subscription_id: data.id,
          paddle_customer_id:     customerId,
          plan_tier:              planTier,
          status:                 "active",
          next_billing_date:      currentPeriodEnd,
          updated_at:             new Date().toISOString(),
        }, { onConflict: "paddle_subscription_id" })

        // Profile plan tier
        await service
          .from("profiles")
          .update({ plan_tier: planTier, paddle_customer_id: customerId, updated_at: new Date().toISOString() })
          .eq("id", profile.id)

        // Workspace billing
        await syncWorkspaceBilling(service, profile.id, {
          planTier, status: "active",
          paddleSubscriptionId: data.id,
          paddleCustomerId:     customerId,
          currentPeriodEnd,
        })

        console.log("[Paddle Webhook] Activated:", planTier, "user:", profile.id)
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
            status:               data.status ?? "active",
            plan_tier:            planTier,
            next_billing_date:    currentPeriodEnd,
            cancel_at_period_end: !!data.paused_at,
            updated_at:           new Date().toISOString(),
          })
          .eq("paddle_subscription_id", data.id)

        await service
          .from("profiles")
          .update({ plan_tier: planTier, updated_at: new Date().toISOString() })
          .eq("id", sub.user_id)

        // Sync workspace billing
        await syncWorkspaceBilling(service, sub.user_id, {
          planTier,
          status:               data.status === "active" ? "active" : "past_due",
          paddleSubscriptionId: data.id,
          currentPeriodEnd,
          cancelAtPeriodEnd:    !!data.paused_at,
        })

        console.log("[Paddle Webhook] Updated:", planTier, "user:", sub.user_id)
        break
      }

      case "subscription.canceled":
      case "subscription.cancelled": {
        if (!data.id) break

        const { data: sub } = await service
          .from("subscriptions")
          .update({ status: "cancelled", cancel_at_period_end: true, updated_at: new Date().toISOString() })
          .eq("paddle_subscription_id", data.id)
          .select("user_id")
          .single()

        if (sub?.user_id) {
          await service
            .from("profiles")
            .update({ plan_tier: "FREE", updated_at: new Date().toISOString() })
            .eq("id", sub.user_id)

          await syncWorkspaceBilling(service, sub.user_id, {
            planTier: "FREE", status: "cancelled",
            paddleSubscriptionId: data.id,
            cancelAtPeriodEnd: true,
          })

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
    // Return 200 to prevent Paddle retrying — error logged above
  }

  return Response.json({ received: true })
}
