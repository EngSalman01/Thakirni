import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getActiveWorkspace, type WorkspaceContext } from "@/lib/workspace/get-active-workspace"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getUserSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export interface AuthResult {
  userId: string
  accessToken: string
  supabase: ReturnType<typeof getUserSupabase>
  service: ReturnType<typeof getServiceSupabase>
  workspace: WorkspaceContext | null
}

export async function requireAuth(req: NextRequest): Promise<AuthResult | Response> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized — missing token" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const supabase = getUserSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: "Unauthorized — invalid token" }, { status: 401 })
  }

  const headerWorkspaceId = req.headers.get("x-workspace-id")
  const workspace = await getActiveWorkspace(user.id, headerWorkspaceId)

  // General API rate limit: 100 req/min, workspace-scoped when available
  const rl = await limiters.api(user.id, workspace?.workspaceId)
  if (!rl.success) return rateLimitResponse(rl.reset)

  return {
    userId: user.id,
    accessToken: token,
    supabase,
    service: getServiceSupabase(),
    workspace,
  }
}

/**
 * Check if a plan-gated feature is allowed.
 * @param planOwnerId - the workspace owner's user ID (governs the plan tier)
 */
export async function checkPlanFeature(
  planOwnerId: string,
  feature: "meeting_summary" | "document_ai" | "voice_note"
): Promise<{ allowed: boolean; tier: string }> {
  const { getWorkspacePlanTier } = await import("@/lib/workspace/get-active-workspace")
  const tier = await getWorkspacePlanTier(planOwnerId)

  const freeLimits: Record<string, boolean> = {
    meeting_summary: false,
    document_ai: false,
    voice_note: false,
  }

  return { allowed: tier !== "FREE" || freeLimits[feature] !== false, tier }
}

export { getUserSupabase, getServiceSupabase }
