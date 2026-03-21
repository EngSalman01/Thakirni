import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getUserPlanTier, getUserLimits, PLAN_PRICES } from "@/lib/services/subscription.service"

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const [tier, limits, subscriptionResult] = await Promise.all([
    getUserPlanTier(auth.userId),
    getUserLimits(auth.userId),
    auth.supabase.from("subscriptions").select("*").eq("user_id", auth.userId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ])

  return Response.json({ tier, limits, subscription: subscriptionResult.data ?? null, prices: PLAN_PRICES })
}
