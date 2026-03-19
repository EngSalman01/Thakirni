import { createRouter } from "../lib/types.js"
import { Hono } from "hono"
import { requireAuth } from "../middleware/auth.js"
import { getUserSupabase, getServiceSupabase } from "../lib/supabase.js"
import { getUserPlanTier, getUserLimits, PLAN_PRICES, PLAN_LIMITS } from "../services/subscription.service.js"

export const subscriptionsRouter = createRouter()
subscriptionsRouter.use("*", requireAuth)

/** GET /api/subscriptions/me — current user's subscription + limits */
subscriptionsRouter.get("/me", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)

  const [tier, limits, subscriptionResult] = await Promise.all([
    getUserPlanTier(userId),
    getUserLimits(userId),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return c.json({
    tier,
    limits,
    subscription: subscriptionResult.data ?? null,
    prices: PLAN_PRICES,
  })
})

/** GET /api/subscriptions/plans — list all available plans */
subscriptionsRouter.get("/plans", async (c) => {
  return c.json({
    plans: [
      {
        tier: "FREE",
        name: "مجاني",
        nameEn: "Free",
        price: { monthly: 0, annual: 0 },
        limits: PLAN_LIMITS.FREE,
        features: [
          "١٠ خطط يومياً",
          "٢٥ ذاكرة",
          "مشروع واحد",
          "محادثة AI أساسية",
          "تتبع العادات والأهداف",
        ],
        featuresEn: [
          "10 plans per day",
          "25 memories",
          "1 project",
          "Basic AI chat",
          "Habit & goal tracking",
        ],
      },
      {
        tier: "PRO",
        name: "برو",
        nameEn: "Pro",
        price: {
          monthly: { usd: 9, paddlePriceId: process.env.PADDLE_PRICE_PRO_MONTHLY ?? "" },
          annual: { usd: 79, paddlePriceId: process.env.PADDLE_PRICE_PRO_ANNUAL ?? "" },
        },
        limits: PLAN_LIMITS.PRO,
        popular: true,
        features: [
          "خطط غير محدودة",
          "ذكريات غير محدودة",
          "١٠ مشاريع",
          "ملخص الاجتماعات الصوتية 🎙️",
          "تحليل الوثائق بالذكاء الاصطناعي",
          "محادثة AI متقدمة",
          "تحليلات وتقارير",
          "٣٠٠ دقيقة تسجيل صوتي شهرياً",
        ],
        featuresEn: [
          "Unlimited plans",
          "Unlimited memories",
          "10 projects",
          "Meeting voice summary 🎙️",
          "Document AI analysis",
          "Advanced AI chat",
          "Analytics & reports",
          "300 min voice recording/month",
        ],
      },
      {
        tier: "TEAMS",
        name: "فرق",
        nameEn: "Teams",
        price: {
          monthly: { usd: 19, paddlePriceId: process.env.PADDLE_PRICE_TEAMS_MONTHLY ?? "" },
          annual: { usd: 159, paddlePriceId: process.env.PADDLE_PRICE_TEAMS_ANNUAL ?? "" },
        },
        limits: PLAN_LIMITS.TEAMS,
        features: [
          "كل مميزات برو",
          "فرق تعاون غير محدودة",
          "مشاريع غير محدودة",
          "لوحة كانبان مشتركة",
          "ذكريات مشتركة",
          "تقارير الفريق",
          "دعم أولوية",
        ],
        featuresEn: [
          "Everything in Pro",
          "Unlimited team collaboration",
          "Unlimited projects",
          "Shared Kanban boards",
          "Shared memories",
          "Team reports",
          "Priority support",
        ],
      },
    ],
  })
})

/** POST /api/subscriptions/portal — create a billing portal URL */
subscriptionsRouter.post("/portal", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("paddle_customer_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .single()

  if (!sub?.paddle_customer_id) {
    return c.json({ error: "No active subscription found" }, 404)
  }

  // Return the Paddle billing portal URL
  const portalUrl = `https://sandbox-buy.paddle.com/customers/${sub.paddle_customer_id}/portal`
  return c.json({ url: portalUrl })
})

/** POST /api/subscriptions/cancel */
subscriptionsRouter.post("/cancel", async (c) => {
  const userId = c.get("userId") as string
  const service = getServiceSupabase()

  const { data: sub } = await service
    .from("subscriptions")
    .select("paddle_subscription_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .single()

  if (!sub?.paddle_subscription_id) {
    return c.json({ error: "No active subscription found" }, 404)
  }

  // TODO: Call Paddle API to cancel subscription
  // For now, mark as cancelled in our DB
  await service
    .from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active")

  return c.json({ success: true, message: "Subscription will cancel at period end" })
})
