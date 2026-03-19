"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Get user subscription
export async function getUserSubscription() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { subscription };
  } catch (error) {
    console.error("Get subscription error:", error);
    return { error: "Failed to fetch subscription" };
  }
}

// Create subscription
export async function createSubscription(
  subscriptionType: "individual" | "team" | "company",
  planName: string,
  price?: number,
  billingCycle?: "monthly" | "yearly"
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        subscription_type: subscriptionType,
        plan_name: planName,
        price,
        billing_cycle: billingCycle,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true, subscription };
  } catch (error) {
    console.error("Create subscription error:", error);
    return { error: "Failed to create subscription" };
  }
}

// Update subscription
export async function updateSubscription(subscriptionId: string, updates: Record<string, any>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("subscriptions")
      .update(updates)
      .eq("id", subscriptionId)
      .eq("user_id", user.id);

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    console.error("Update subscription error:", error);
    return { error: "Failed to update subscription" };
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", subscriptionId)
      .eq("user_id", user.id);

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { error: "Failed to cancel subscription" };
  }
}

// Sync subscription with Paddle
export async function syncPaddleSubscription(paddleSubscriptionId: string) {
  try {
    const { getPaddleSubscription } = await import("@/lib/paddle/service");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: "Unauthorized" };

    // Fetch latest subscription data from Paddle
    const paddleSubscription = await getPaddleSubscription(paddleSubscriptionId);
    
    if (!paddleSubscription) {
      return { error: "Subscription not found in Paddle" };
    }

    // Update subscription in database
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status: paddleSubscription.status,
        next_billing_date: paddleSubscription.nextBilledAt,
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", paddleSubscriptionId)
      .eq("user_id", user.id);

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true, subscription: paddleSubscription };
  } catch (error) {
    console.error("Sync Paddle subscription error:", error);
    return { error: "Failed to sync subscription" };
  }
}
