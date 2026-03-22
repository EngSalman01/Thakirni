import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PlanTier = "free" | "pro" | "teams";

interface ActiveSubscription {
  paddle_subscription_id: string | null;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  status: string;
}

export function useSubscription() {
  const [tier, setTier] = useState<PlanTier>("free");
  const [subscription, setSubscription] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setTier("free"); setLoading(false); return; }

        // Source of truth: profiles.plan_tier
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan_tier")
          .eq("id", user.id)
          .single();

        const raw = (profile?.plan_tier ?? "") as string;
        setTier(normalizeTier(raw));

        // Also fetch active subscription for cancel/period info
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("paddle_subscription_id, cancel_at_period_end, current_period_end, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (sub) setSubscription(sub as ActiveSubscription);
      } catch (err) {
        console.error("[useSubscription]", err);
        setError(err instanceof Error ? err.message : "Failed to fetch plan");
        setTier("free");
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  return {
    tier,
    subscription,
    loading,
    error,
    isPro: tier === "pro",
    isTeams: tier === "teams",
    isFree: tier === "free",
    isPaid: tier === "pro" || tier === "teams",
    // legacy compat
    subscriptionType: tier === "teams" ? "team" : tier === "pro" ? "individual" : "free",
    isIndividual: tier === "pro",
    isTeam: tier === "teams",
  };
}

export function normalizeTier(raw: string): PlanTier {
  const v = (raw ?? "").toUpperCase();
  if (v === "TEAMS" || v === "COMPANY" || v === "TEAM") return "teams";
  if (v === "PRO" || v === "INDIVIDUAL") return "pro";
  return "free";
}
