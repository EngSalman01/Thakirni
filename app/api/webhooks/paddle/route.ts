import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Verify Paddle webhook signature
 */
function verifyPaddleWebhook(body: string, signature: string): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET || "";
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return hash === signature;
}

/**
 * Parse Paddle webhook payload
 */
interface PaddleWebhookData {
  type: string;
  data: {
    id?: string;
    customerId?: string;
    subscriptionId?: string;
    status?: string;
    currentBillingPeriod?: {
      endsAt: string;
    };
    nextBilledAt?: string;
    pausedAt?: string;
    cancelledAt?: string;
    priceId?: string;
  };
}

/**
 * Handle subscription.created event
 */
async function handleSubscriptionCreated(
  customerId: string,
  subscriptionId: string,
  data: any
) {
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("paddle_customer_id", customerId)
    .single();

  if (!userData) {
    console.error(
      "[Webhook] User not found for customer:",
      customerId
    );
    return;
  }

  const nextBilledAt = data.nextBilledAt
    ? new Date(data.nextBilledAt)
    : null;

  await supabase.from("subscriptions").upsert(
    {
      user_id: userData.id,
      paddle_subscription_id: subscriptionId,
      paddle_customer_id: customerId,
      plan_tier: getPlanTierFromPriceId(data.priceId),
      billing_cycle: getBillingCycleFromPriceId(data.priceId),
      status: data.status || "active",
      next_billing_date: nextBilledAt?.toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "paddle_subscription_id",
    }
  );

  console.log(
    "[Webhook] Subscription created:",
    subscriptionId
  );
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(
  subscriptionId: string,
  data: any
) {
  const nextBilledAt = data.nextBilledAt
    ? new Date(data.nextBilledAt)
    : null;

  await supabase
    .from("subscriptions")
    .update({
      status: data.status,
      next_billing_date: nextBilledAt?.toISOString(),
      cancel_at_period_end: data.pausedAt ? true : false,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", subscriptionId);

  console.log(
    "[Webhook] Subscription updated:",
    subscriptionId
  );
}

/**
 * Handle subscription.cancelled event
 */
async function handleSubscriptionCancelled(subscriptionId: string) {
  await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", subscriptionId);

  console.log(
    "[Webhook] Subscription cancelled:",
    subscriptionId
  );
}

/**
 * Helper to extract plan tier from price ID
 */
function getPlanTierFromPriceId(priceId: string): string {
  if (priceId.includes("individual")) return "individual";
  if (priceId.includes("team")) return "team";
  return "free";
}

/**
 * Helper to extract billing cycle from price ID
 */
function getBillingCycleFromPriceId(priceId: string): "monthly" | "annual" {
  return priceId.includes("annual") ? "annual" : "monthly";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("paddle-signature") || "";

    // Verify webhook signature
    if (!verifyPaddleWebhook(body, signature)) {
      console.error("[Webhook] Invalid Paddle signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload: PaddleWebhookData = JSON.parse(body);
    const eventType = payload.type;
    const eventData = payload.data;

    console.log("[Webhook] Received Paddle event:", eventType);

    switch (eventType) {
      case "subscription.created":
        if (eventData.customerId && eventData.subscriptionId) {
          await handleSubscriptionCreated(
            eventData.customerId,
            eventData.subscriptionId,
            eventData
          );
        }
        break;

      case "subscription.updated":
        if (eventData.subscriptionId) {
          await handleSubscriptionUpdated(
            eventData.subscriptionId,
            eventData
          );
        }
        break;

      case "subscription.cancelled":
        if (eventData.subscriptionId) {
          await handleSubscriptionCancelled(eventData.subscriptionId);
        }
        break;

      case "transaction.completed":
        // Optional: handle transaction completion for one-time payments
        console.log("[Webhook] Transaction completed:", eventData.id);
        break;

      default:
        console.log("[Webhook] Unhandled event type:", eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
