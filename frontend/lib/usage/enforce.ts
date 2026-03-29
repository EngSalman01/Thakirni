import { createClient } from "@supabase/supabase-js"
import { getLimitsForTier } from "./limits"
import { checkGlobalBudget, incrementGlobalUsage } from "./global-budget"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type UsageFeature =
  | "ai_chat"
  | "document_upload"
  | "meeting_summary"
  | "voice_note"

export interface EnforceResult {
  allowed: boolean
  reason?: "upgrade_required" | "limit_exceeded" | "kill_switch" | "daily_cap" | "global_budget_exceeded"
  remaining?: number
  tier?: string
  usingCredits?: boolean
}

const FEATURE_TO_MONTHLY_FIELD: Record<UsageFeature, keyof import("./limits").UsageLimits> = {
  ai_chat:          "aiChatRequests",
  document_upload:  "documentUploads",
  meeting_summary:  "meetingSummaries",
  voice_note:       "voiceNoteMinutes",
}

const FEATURE_TO_DB_FIELD: Record<UsageFeature, string> = {
  ai_chat:          "ai_chat_requests",
  document_upload:  "document_uploads",
  meeting_summary:  "meeting_summaries",
  voice_note:       "voice_note_minutes",
}

async function isKillSwitchActive(): Promise<boolean> {
  try {
    const service = getServiceSupabase()
    const { data } = await service
      .from("feature_flags")
      .select("enabled")
      .eq("key", "ai_kill_switch")
      .single()
    return data?.enabled === true
  } catch {
    return false
  }
}

/**
 * Full enforcement pipeline:
 * 1. Global kill switch
 * 2. Global system budget (cached, 60s TTL)
 * 3. Plan tier — feature access
 * 4. Monthly limit (credits fallback if exceeded)
 * 5. Daily request cap (hard absolute cap)
 */
export async function enforceUsage(
  userId: string,
  feature: UsageFeature
): Promise<EnforceResult> {
  const service = getServiceSupabase()

  // 1. Kill switch
  if (await isKillSwitchActive()) {
    return { allowed: false, reason: "kill_switch" }
  }

  // 2. Global system budget
  const budget = await checkGlobalBudget()
  if (!budget.allowed) {
    return { allowed: false, reason: "global_budget_exceeded" }
  }

  // 3. Plan tier
  const { data: profile } = await service
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .single()

  const tier = (profile?.plan_tier ?? "FREE") as string
  const limits = getLimitsForTier(tier)

  const limitKey = FEATURE_TO_MONTHLY_FIELD[feature]
  const monthlyLimit = limits[limitKey] as number

  if (monthlyLimit === 0) {
    // Feature not available on this plan — try credits
    const { data: creditsAllowed } = await service
      .rpc("consume_credits", { p_user_id: userId, p_amount: 1 })
    if (creditsAllowed) {
      incrementGlobalUsage().catch(() => {})
      return { allowed: true, remaining: 0, tier, usingCredits: true }
    }
    return { allowed: false, reason: "upgrade_required", tier }
  }

  // 4. Monthly limit
  const month = new Date().toISOString().slice(0, 7)
  const { data: usage } = await service
    .rpc("get_or_create_usage", { p_user_id: userId, p_month: month })

  if (usage) {
    const dbField = FEATURE_TO_DB_FIELD[feature]
    const currentCount = (usage as Record<string, number>)[dbField] ?? 0

    if (currentCount >= monthlyLimit) {
      // Try credits as fallback before blocking
      const { data: creditsAllowed } = await service
        .rpc("consume_credits", { p_user_id: userId, p_amount: 1 })
      if (creditsAllowed) {
        incrementGlobalUsage().catch(() => {})
        return { allowed: true, remaining: 0, tier, usingCredits: true }
      }
      return { allowed: false, reason: "limit_exceeded", remaining: 0, tier }
    }
  }

  // 5. Daily request cap (only for ai_chat to avoid per-document overhead)
  if (feature === "ai_chat") {
    const date = new Date().toISOString().slice(0, 10)
    const { data: daily } = await service
      .from("usage_daily")
      .select("ai_chat_requests")
      .eq("user_id", userId)
      .eq("date", date)
      .single()

    const dailyCount = (daily as { ai_chat_requests: number } | null)?.ai_chat_requests ?? 0
    if (dailyCount >= limits.aiChatRequestsPerDay) {
      return { allowed: false, reason: "daily_cap", remaining: 0, tier }
    }
  }

  // 6. Hard absolute daily request cap (all AI features)
  const date = new Date().toISOString().slice(0, 10)
  const { data: dailyTotal } = await service
    .from("usage_daily")
    .select("requests_total")
    .eq("user_id", userId)
    .eq("date", date)
    .single()

  const totalToday = (dailyTotal as { requests_total: number } | null)?.requests_total ?? 0
  if (totalToday >= limits.maxRequestsPerDay) {
    return { allowed: false, reason: "daily_cap", remaining: 0, tier }
  }

  const monthlyRemaining = usage
    ? monthlyLimit - ((usage as Record<string, number>)[FEATURE_TO_DB_FIELD[feature]] ?? 0)
    : monthlyLimit

  incrementGlobalUsage().catch(() => {})
  return { allowed: true, remaining: monthlyRemaining, tier }
}
