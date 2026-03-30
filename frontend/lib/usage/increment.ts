import { createClient as createSbClient } from "@supabase/supabase-js"
import type { UsageFeature } from "./enforce"

function getServiceSupabase() {
  return createSbClient(
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
 * Increment workspace-scoped usage counter AFTER a successful AI action.
 * Fire-and-forget — errors are logged but never thrown.
 *
 * @param userId      - acting user (attribution)
 * @param feature     - feature to increment
 * @param amount      - increment amount (default 1)
 * @param workspaceId - the active workspace (primary dimension)
 */
export async function incrementUsage(
  userId: string,
  feature: UsageFeature,
  amount = 1,
  workspaceId?: string
): Promise<void> {
  try {
    const service = getServiceSupabase()
    const month = new Date().toISOString().slice(0, 7)
    const field = FEATURE_TO_FIELD[feature]

    if (workspaceId) {
      await service.rpc("increment_usage", {
        p_workspace_id: workspaceId,
        p_month: month,
        p_field: field,
        p_amount: amount,
        p_user_id: userId,
      })
    } else {
      // Fallback: resolve workspace from user's personal workspace
      const { data: ws } = await service
        .from("workspaces")
        .select("id")
        .eq("type", "personal")
        .eq("owner_id", userId)
        .single()
      if (ws) {
        await service.rpc("increment_usage", {
          p_workspace_id: ws.id,
          p_month: month,
          p_field: field,
          p_amount: amount,
          p_user_id: userId,
        })
      }
    }
  } catch (err) {
    console.error("[usage/increment] Failed:", err)
  }
}

/**
 * Increment workspace-scoped daily stats.
 * Fire-and-forget.
 */
export async function incrementDailyUsage(
  userId: string,
  field: "ai_chat_requests" | "plans_created" | "requests_total",
  amount = 1,
  workspaceId?: string
): Promise<void> {
  try {
    const service = getServiceSupabase()
    const date = new Date().toISOString().slice(0, 10)

    const effectiveWorkspaceId = workspaceId ?? await resolvePersonalWorkspace(userId)
    if (!effectiveWorkspaceId) return

    await service.rpc("increment_usage_daily", {
      p_workspace_id: effectiveWorkspaceId,
      p_date: date,
      p_field: field,
      p_amount: amount,
      p_user_id: userId,
    })
  } catch (err) {
    console.error("[usage/increment_daily] Failed:", err)
  }
}

async function resolvePersonalWorkspace(userId: string): Promise<string | null> {
  const service = getServiceSupabase()
  const { data } = await service
    .from("workspaces")
    .select("id")
    .eq("type", "personal")
    .eq("owner_id", userId)
    .single()
  return (data as { id: string } | null)?.id ?? null
}
