import { createClient } from "@supabase/supabase-js"
import { getLimitsForTier } from "./limits"

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

interface EnforceResult {
  allowed: boolean
  reason?: "upgrade_required" | "limit_exceeded" | "kill_switch"
  remaining?: number
  tier?: string
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

/** Check AI kill switch (feature_flags table) */
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
 * Check if a user is allowed to perform an AI action.
 * Call BEFORE executing the AI call.
 */
export async function enforceUsage(
  userId: string,
  feature: UsageFeature
): Promise<EnforceResult> {
  const service = getServiceSupabase()

  // 1. Global kill switch
  if (await isKillSwitchActive()) {
    return { allowed: false, reason: "kill_switch" }
  }

  // 2. Get user plan tier
  const { data: profile } = await service
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .single()

  const tier = (profile?.plan_tier ?? "FREE") as string
  const limits = getLimitsForTier(tier)

  // 3. Check feature access (zero limit = not available)
  const limitKey = FEATURE_TO_MONTHLY_FIELD[feature]
  const monthlyLimit = limits[limitKey] as number

  if (monthlyLimit === 0) {
    return { allowed: false, reason: "upgrade_required", tier }
  }

  // 4. Check current month usage
  const month = new Date().toISOString().slice(0, 7)
  const { data: usage } = await service
    .rpc("get_or_create_usage", { p_user_id: userId, p_month: month })

  if (usage) {
    const dbField = FEATURE_TO_DB_FIELD[feature]
    const currentCount = (usage as Record<string, number>)[dbField] ?? 0

    if (currentCount >= monthlyLimit) {
      return { allowed: false, reason: "limit_exceeded", remaining: 0, tier }
    }

    return { allowed: true, remaining: monthlyLimit - currentCount, tier }
  }

  return { allowed: true, remaining: monthlyLimit, tier }
}
