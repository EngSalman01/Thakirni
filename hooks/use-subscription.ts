import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SubscriptionType = "individual" | "team" | "company";

interface Subscription {
  id: string;
  subscription_type: SubscriptionType;
  plan_name: string;
  status: "active" | "inactive" | "cancelled";
  created_at: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>("individual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        setLoading(true);
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setSubscriptionType("individual");
          setLoading(false);
          return;
        }

        // Fetch user's active subscription
        const { data, error: err } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (err && err.code !== "PGRST116") {
          // PGRST116 = no rows returned
          throw err;
        }

        if (data) {
          setSubscription(data);
          setSubscriptionType(data.subscription_type);
        } else {
          // Default to individual if no subscription found
          setSubscriptionType("individual");
        }
      } catch (err) {
        console.error("[v0] Error fetching subscription:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch subscription");
        setSubscriptionType("individual");
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, []);

  return {
    subscription,
    subscriptionType,
    loading,
    error,
    isIndividual: subscriptionType === "individual",
    isTeam: subscriptionType === "team",
    isCompany: subscriptionType === "company",
  };
}
