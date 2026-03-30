import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { createClient } from "@supabase/supabase-js"
import { getLimitsForTier } from "@/lib/usage/limits"
import { getWorkspacePlanTier } from "@/lib/workspace/get-active-workspace"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const service = getServiceSupabase()
  const workspaceId = auth.workspace?.workspaceId
  const planOwner   = auth.workspace?.ownerId ?? auth.userId

  // Plan tier resolved from workspace owner
  const tier   = await getWorkspacePlanTier(planOwner)
  const limits = getLimitsForTier(tier)

  // Current month usage — workspace-scoped when possible
  const month = new Date().toISOString().slice(0, 7)

  let u: Record<string, number> = {}

  if (workspaceId) {
    const { data: usage } = await service
      .rpc("get_or_create_usage", {
        p_workspace_id: workspaceId,
        p_month: month,
        p_user_id: auth.userId,
      })
    u = (usage as Record<string, number> | null) ?? {}
  } else {
    const { data: usage } = await service
      .from("usage")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("month", month)
      .single()
    u = (usage as Record<string, number> | null) ?? {}
  }

  const aiChat       = u["ai_chat_requests"]   ?? 0
  const documents    = u["document_uploads"]   ?? 0
  const meetings     = u["meeting_summaries"]  ?? 0
  const voiceMinutes = u["voice_note_minutes"] ?? 0

  return Response.json({
    tier,
    workspace: workspaceId
      ? { id: workspaceId, role: auth.workspace?.role, type: auth.workspace?.workspaceType }
      : null,
    limits: {
      aiChatRequests:    limits.aiChatRequests,
      documentUploads:   limits.documentUploads,
      meetingSummaries:  limits.meetingSummaries,
      voiceNoteMinutes:  limits.voiceNoteMinutes,
    },
    usage: {
      aiChatRequests:    aiChat,
      documentUploads:   documents,
      meetingSummaries:  meetings,
      voiceNoteMinutes:  voiceMinutes,
    },
    pct: {
      aiChatRequests:   limits.aiChatRequests   > 0 ? Math.round((aiChat       / limits.aiChatRequests)   * 100) : 100,
      documentUploads:  limits.documentUploads  > 0 ? Math.round((documents    / limits.documentUploads)  * 100) : 100,
      meetingSummaries: limits.meetingSummaries > 0 ? Math.round((meetings     / limits.meetingSummaries) * 100) : 100,
      voiceNoteMinutes: limits.voiceNoteMinutes > 0 ? Math.round((voiceMinutes / limits.voiceNoteMinutes) * 100) : 100,
    },
  })
}
