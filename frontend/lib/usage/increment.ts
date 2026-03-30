import { createClient } from "@supabase/supabase-js"
import type { UsageFeature } from "./enforce"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const FEATURE_TO_FIELD: Record<UsageFeature, string> = {
  ai_chat:          "ai_chat_requests",
  document_upload:  "document_uploads",
  meeting_summary:  "meeting_summaries",
  voice_note:       "voice_note_minutes",
}

/**
 * Increment usage counter AFTER a successful AI action.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function incrementUsage(
  userId: string,
  feature: UsageFeature,
  amount = 1,
  _workspaceId?: string   // reserved for workspace-scoped tracking
): Promise<void> {
  try {
    const service = getServiceSupabase()
    const month = new Date().toISOString().slice(0, 7)
    const field = FEATURE_TO_FIELD[feature]

    await service.rpc("increment_usage", {
      p_user_id: userId,
      p_month: month,
      p_field: field,
      p_amount: amount,
    })
  } catch (err) {
    console.error("[usage/increment] Failed:", err)
  }
}

/** Also increment daily stats (plans, requests) */
export async function incrementDailyUsage(
  userId: string,
  field: "ai_chat_requests" | "plans_created" | "requests_total",
  amount = 1,
  _workspaceId?: string   // reserved for workspace-scoped tracking
): Promise<void> {
  try {
    const service = getServiceSupabase()
    const date = new Date().toISOString().slice(0, 10)

    await service.rpc("increment_usage_daily", {
      p_user_id: userId,
      p_date: date,
      p_field: field,
      p_amount: amount,
    })
  } catch (err) {
    console.error("[usage/increment_daily] Failed:", err)
  }
}
