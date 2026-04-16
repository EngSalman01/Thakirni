import { createClient } from "@supabase/supabase-js"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface WorkspaceContext {
  workspaceId: string
  role: "owner" | "admin" | "member"
  workspaceType: "personal" | "team"
  ownerId: string
}

/**
 * Resolve the active workspace for a user.
 *
 * Priority:
 * 1. `headerWorkspaceId` (from `x-workspace-id` request header) — verified against membership
 * 2. User's personal workspace (always exists after signup trigger)
 *
 * Returns null only if the user has no workspaces at all (should never happen after onboarding).
 */
export async function getActiveWorkspace(
  userId: string,
  headerWorkspaceId?: string | null
): Promise<WorkspaceContext | null> {
  const service = getServiceSupabase()

  // Attempt header-specified workspace first
  if (headerWorkspaceId) {
    const { data: membership } = await service
      .from("workspace_members")
      .select("role, workspace:workspaces(id, type, owner_id)")
      .eq("workspace_id", headerWorkspaceId)
      .eq("user_id", userId)
      .single()

    if (membership) {
      const ws = membership.workspace as unknown as { id: string; type: string; owner_id: string } | null
      if (ws) {
        return {
          workspaceId: ws.id,
          role: membership.role as WorkspaceContext["role"],
          workspaceType: ws.type as WorkspaceContext["workspaceType"],
          ownerId: ws.owner_id,
        }
      }
    }
  }

  // Fall back to personal workspace — owner is always a member with role "owner"
  const { data: personal } = await service
    .from("workspaces")
    .select("id, type, owner_id")
    .eq("type", "personal")
    .eq("owner_id", userId)
    .single()

  if (personal) {
    return {
      workspaceId: personal.id,
      role: "owner",
      workspaceType: "personal",
      ownerId: personal.owner_id,
    }
  }

  // Last resort: any workspace the user belongs to
  const { data: any } = await service
    .from("workspace_members")
    .select("role, workspace:workspaces(id, type, owner_id)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .single()

  if (any) {
    const ws = any.workspace as unknown as { id: string; type: string; owner_id: string } | null
    if (ws) {
      return {
        workspaceId: ws.id,
        role: any.role as WorkspaceContext["role"],
        workspaceType: ws.type as WorkspaceContext["workspaceType"],
        ownerId: ws.owner_id,
      }
    }
  }

  return null
}

/**
 * Resolve the effective plan tier for a workspace.
 *
 * Source of truth: workspace_billing.subscription_tier (decoupled from ownership).
 * Falls back to the owner's profiles.plan_tier if no billing row exists yet
 * (e.g., new workspaces before the first Paddle event).
 *
 * This design allows future ownership transfers and enterprise billing
 * without touching plan resolution logic.
 */
export async function getWorkspacePlanTier(
  workspaceIdOrOwnerId: string,
  isWorkspaceId = false
): Promise<string> {
  const service = getServiceSupabase()

  if (isWorkspaceId) {
    // Resolve directly by workspace_id
    const { data: billing } = await service
      .from("workspace_billing")
      .select("subscription_tier, subscription_status")
      .eq("workspace_id", workspaceIdOrOwnerId)
      .single()

    if (billing && billing.subscription_status === "active") {
      return billing.subscription_tier as string
    }

    // Billing row inactive OR missing — read owner's profile.plan_tier directly
    // (Paddle webhook may have updated profile but not workspace_billing)
    const { data: ws } = await service
      .from("workspaces")
      .select("owner_id")
      .eq("id", workspaceIdOrOwnerId)
      .single()
    if (!ws) return "FREE"

    const { data: profile } = await service
      .from("profiles")
      .select("plan_tier")
      .eq("id", ws.owner_id)
      .single()
    return (profile?.plan_tier ?? "FREE") as string
  }

  // Legacy / fallback path: ownerId — find their personal workspace billing first
  const { data: ws } = await service
    .from("workspaces")
    .select("id")
    .eq("type", "personal")
    .eq("owner_id", workspaceIdOrOwnerId)
    .single()

  if (ws) {
    return getWorkspacePlanTier(ws.id, true)
  }

  // Ultimate fallback: owner's profile plan_tier
  const { data: profile } = await service
    .from("profiles")
    .select("plan_tier")
    .eq("id", workspaceIdOrOwnerId)
    .single()
  return (profile?.plan_tier ?? "FREE") as string
}
