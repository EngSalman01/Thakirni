import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPaddleTransaction, getPaddleSubscription } from "@/lib/paddle/service";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Verify Paddle payment and create subscription in database
 * POST /api/paddle/verify-payment
 * Body: { transactionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Verify transaction with Paddle
    const transaction = await verifyPaddleTransaction(transactionId);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Check if transaction status is completed
    if (transaction.status !== "completed") {
      return NextResponse.json(
        { error: "Transaction not completed" },
        { status: 400 }
      );
    }

    // Get current user from auth
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get subscription from Paddle if this is a subscription transaction
    let subscriptionId = transaction.subscriptionId;
    let planTier = "free";
    let billingCycle: "monthly" | "annual" = "monthly";

    if (subscriptionId) {
      const subscription = await getPaddleSubscription(subscriptionId);
      if (subscription) {
        planTier = getPlanTierFromPriceId(subscription.priceId);
        billingCycle = getBillingCycleFromPriceId(subscription.priceId);
      }
    }

    // Update or create subscription in database
    const serviceRoleSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { error: updateError } = await serviceRoleSupabase
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          paddle_subscription_id: subscriptionId,
          paddle_customer_id: transaction.customerId,
          paddle_transaction_id: transaction.id,
          plan_tier: planTier,
          billing_cycle: billingCycle,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "paddle_subscription_id",
        }
      );

    if (updateError) {
      console.error("[Verify Payment] Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    // Also update user's plan in users table if needed
    await serviceRoleSupabase
      .from("users")
      .update({
        plan_tier: planTier,
        paddle_customer_id: transaction.customerId,
      })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscriptionId,
        planTier,
        billingCycle,
        status: "active",
      },
    });
  } catch (error) {
    console.error("[Verify Payment] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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
