import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { syncSubscriptionToProfile } from "@/lib/services/subscription.service"
import { sendSubscriptionConfirmed, sendPaymentReceipt, sendSubscriptionCancelled, sendPaymentFailed } from "@/lib/emails"
import crypto from "crypto"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function verifyPaddleSignature(body: string, signatureHeader: string): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET ?? ""
  if (!secret || !signatureHeader) return false

  // Parse ts=...;h1=... format from Paddle-Signature header
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => p.split("=") as [string, string])
  )
  const ts = parts["ts"]
  const h1 = parts["h1"]
  if (!ts || !h1) return false

  // Paddle signs: "timestamp:body"
  const signed = `${ts}:${body}`
  const expected = crypto.createHmac("sha256", secret).update(signed).digest("hex")

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(h1))
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
        items?: Array<{ price?: { id: string }; totals?: { total?: string; currency_code?: string } }>
        custom_data?: { user_id?: string }
        billing_details?: { invoice_number?: string }
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

        let { data: profile } = await service
          .from("profiles")
          .select("id, full_name")
          .eq("paddle_customer_id", customerId)
          .maybeSingle()

        if (!profile && d.custom_data?.user_id) {
          const { data: p } = await service
            .from("profiles")
            .select("id, full_name")
            .eq("id", d.custom_data.user_id)
            .maybeSingle()
          profile = p
        }

        if (!profile) break

        await service.from("subscriptions").upsert({
          user_id: profile.id,
          paddle_subscription_id: d.id,
          paddle_customer_id: customerId,
          plan_tier: planTier,
          status: "active",
          current_period_end: d.next_billed_at ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "paddle_subscription_id" })

        await syncSubscriptionToProfile(profile.id, priceId, "active")

        // Get user email and send confirmation
        const { data: authUser } = await service.auth.admin.getUserById(profile.id)
        if (authUser.user?.email) {
          const amount = d.items?.[0]?.totals?.total ?? "0"
          const currency = d.items?.[0]?.totals?.currency_code ?? "USD"
          const nextDate = d.next_billed_at
            ? new Date(d.next_billed_at).toLocaleDateString("en-GB") : "—"
          const planNameAr = planTier === "TEAMS" ? "فريق" : "برو"

          sendSubscriptionConfirmed({
            to: authUser.user.email,
            name: profile.full_name ?? "there",
            planName: planTier === "TEAMS" ? "Teams" : "Pro",
            planNameAr,
            amount,
            currency,
            nextBillingDate: nextDate,
          }).catch(console.error)

          sendPaymentReceipt({
            to: authUser.user.email,
            name: profile.full_name ?? "there",
            planName: planTier === "TEAMS" ? "Teams" : "Pro",
            planNameAr,
            amount,
            currency,
            invoiceId: d.billing_details?.invoice_number,
            date: new Date().toLocaleDateString("en-GB"),
          }).catch(console.error)
        }
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
          status: "canceled",
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        }).eq("paddle_subscription_id", d.id).select("user_id, plan_tier, current_period_end").maybeSingle()

        if (sub?.user_id) {
          await syncSubscriptionToProfile(sub.user_id, "", "canceled")

          const { data: profileData } = await service.from("profiles").select("full_name").eq("id", sub.user_id).maybeSingle()
          const { data: authUser } = await service.auth.admin.getUserById(sub.user_id)
          if (authUser.user?.email) {
            const accessUntil = sub.current_period_end
              ? new Date(sub.current_period_end).toLocaleDateString("en-GB") : "—"
            const planNameAr = sub.plan_tier === "TEAMS" ? "فريق" : "برو"
            sendSubscriptionCancelled({
              to: authUser.user.email,
              name: profileData?.full_name ?? "there",
              planName: sub.plan_tier === "TEAMS" ? "Teams" : "Pro",
              planNameAr,
              accessUntil,
            }).catch(console.error)
          }
        }
        break
      }

      case "subscription.payment.failed": {
        if (!d.id) break
        const { data: sub } = await service.from("subscriptions").select("user_id, plan_tier").eq("paddle_subscription_id", d.id).maybeSingle()
        if (sub?.user_id) {
          const { data: profileData } = await service.from("profiles").select("full_name").eq("id", sub.user_id).maybeSingle()
          const { data: authUser } = await service.auth.admin.getUserById(sub.user_id)
          if (authUser.user?.email) {
            const planNameAr = sub.plan_tier === "TEAMS" ? "فريق" : "برو"
            sendPaymentFailed({
              to: authUser.user.email,
              name: profileData?.full_name ?? "there",
              planName: sub.plan_tier === "TEAMS" ? "Teams" : "Pro",
              planNameAr,
            }).catch(console.error)
          }
        }
        break
      }
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error("[Paddle Webhook] Error:", err)
    return Response.json({ error: "Internal error" }, { status: 500 })
  }
}
