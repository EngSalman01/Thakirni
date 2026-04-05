/**
 * Centralized upgrade nudge logic.
 *
 * Determines whether, when, and how to show upgrade prompts based on:
 *   - Usage ratio (70%, 80%, 90%, 100%)
 *   - Feature gate hits
 *   - Behavior signals (heavy AI user, heavy WhatsApp user)
 *
 * Used by:
 *   - morning-briefing cron (WhatsApp nudge)
 *   - API route responses (inline nudge in JSON)
 *   - UI components (upgrade-nudge.tsx)
 */

import { createClient } from "@supabase/supabase-js"
import { getLimitsForTier } from "@/lib/usage/limits"

export type NudgeUrgency = "low" | "medium" | "high" | "critical"
export type NudgeTrigger =
  | "usage_70"
  | "usage_80"
  | "usage_90"
  | "usage_100"
  | "feature_locked"
  | "heavy_user"
  | "credits_low"

export interface UpgradeNudge {
  shouldShow: boolean
  urgency: NudgeUrgency
  trigger: NudgeTrigger | null
  usagePct: number
  messageAr: string
  messageEn: string
  ctaAr: string
  ctaEn: string
  pricingUrl: string
}

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Compute upgrade nudge for a user.
 * Returns shouldShow=false if no nudge is needed.
 */
export async function getUpgradeNudge(
  userId: string,
  workspaceId?: string | null,
  featureLocked?: boolean
): Promise<UpgradeNudge> {
  const base: UpgradeNudge = {
    shouldShow: false,
    urgency: "low",
    trigger: null,
    usagePct: 0,
    messageAr: "",
    messageEn: "",
    ctaAr: "ترقية الحساب",
    ctaEn: "Upgrade",
    pricingUrl: "/pricing",
  }

  try {
    const service = getService()
    const month = new Date().toISOString().slice(0, 7)

    // Fetch usage + plan in parallel
    const [profileResult, usageResult] = await Promise.all([
      service.from("profiles").select("plan_tier, ai_credits").eq("id", userId).single(),
      service.from("usage").select("ai_chat_requests").eq("user_id", userId).eq("month", month).single(),
    ])

    const tier = ((profileResult.data as { plan_tier: string } | null)?.plan_tier ?? "FREE").toUpperCase()
    const credits = (profileResult.data as { ai_credits: number } | null)?.ai_credits ?? 0
    const used = (usageResult.data as { ai_chat_requests: number } | null)?.ai_chat_requests ?? 0

    if (tier !== "FREE") return base // Only nudge FREE users (PRO/TEAMS don't need upgrade nudge)

    const limits = getLimitsForTier(tier)
    const limit = limits.aiChatRequests
    const pct = limit > 0 ? Math.round((used / limit) * 100) : 0

    base.usagePct = pct

    // Feature lock always shows
    if (featureLocked) {
      return {
        ...base,
        shouldShow: true,
        urgency: "medium",
        trigger: "feature_locked",
        messageAr: "هذه الميزة تحتاج ترقية 👀 خلك تستفيد من كل الإمكانيات",
        messageEn: "This feature requires an upgrade 👀 Unlock everything",
        ctaAr: "اكتشف الخطط",
        ctaEn: "See plans",
      }
    }

    // Credits low (< 3)
    if (credits > 0 && credits < 3) {
      return {
        ...base,
        shouldShow: true,
        urgency: "high",
        trigger: "credits_low",
        usagePct: pct,
        messageAr: `تبقى لك ${credits} رصيد فقط 👀 الترقية توفر لك ${limits.aiChatRequests * 16} رسالة شهرياً`,
        messageEn: `Only ${credits} credit${credits > 1 ? "s" : ""} left 👀 Upgrade for ${limits.aiChatRequests * 16} messages/month`,
        ctaAr: "ترقية الحساب",
        ctaEn: "Upgrade now",
      }
    }

    // Usage-based thresholds
    if (pct >= 100) {
      return {
        ...base,
        shouldShow: true,
        urgency: "critical",
        trigger: "usage_100",
        messageAr: "وصلت حد الاستخدام الشهري 🚫 ترقّ الحين وكمل بدون انقطاع",
        messageEn: "You've hit your monthly limit 🚫 Upgrade now to keep going",
        ctaAr: "ترقية الحساب",
        ctaEn: "Upgrade now",
      }
    }

    if (pct >= 90) {
      return {
        ...base,
        shouldShow: true,
        urgency: "high",
        trigger: "usage_90",
        messageAr: `استخدمت ${pct}% من رصيدك الشهري ⚠️ الترقية تفتح لك ${limits.aiChatRequests * 16} رسالة`,
        messageEn: `You've used ${pct}% of your monthly quota ⚠️ Upgrade for ${limits.aiChatRequests * 16} messages`,
        ctaAr: "ترقية الحساب",
        ctaEn: "Upgrade",
      }
    }

    if (pct >= 80) {
      return {
        ...base,
        shouldShow: true,
        urgency: "medium",
        trigger: "usage_80",
        messageAr: `قربت تخلص استخدامك (${pct}%) 👀 الترقية توفر لك أضعاف ذلك`,
        messageEn: `You're at ${pct}% of your limit 👀 Upgrade for way more room`,
        ctaAr: "اكتشف الخطط",
        ctaEn: "See plans",
      }
    }

    if (pct >= 70) {
      return {
        ...base,
        shouldShow: true,
        urgency: "low",
        trigger: "usage_70",
        messageAr: `استخدمت ${pct}% من رصيدك 💡 فكر في الترقية قبل ما تخلص`,
        messageEn: `You've used ${pct}% of your quota 💡 Consider upgrading before you run out`,
        ctaAr: "عرض الخطط",
        ctaEn: "View plans",
      }
    }

    return base
  } catch {
    return base
  }
}

/**
 * Lightweight check: should we show any upgrade prompt?
 * Returns just the ratio (0–1) for quick checks without full nudge build.
 */
export async function getUsageRatio(userId: string): Promise<number> {
  try {
    const service = getService()
    const month = new Date().toISOString().slice(0, 7)

    const [profileResult, usageResult] = await Promise.all([
      service.from("profiles").select("plan_tier").eq("id", userId).single(),
      service.from("usage").select("ai_chat_requests").eq("user_id", userId).eq("month", month).single(),
    ])

    const tier = ((profileResult.data as { plan_tier: string } | null)?.plan_tier ?? "FREE").toUpperCase()
    const used = (usageResult.data as { ai_chat_requests: number } | null)?.ai_chat_requests ?? 0
    const limits = getLimitsForTier(tier)
    return limits.aiChatRequests > 0 ? used / limits.aiChatRequests : 0
  } catch {
    return 0
  }
}
