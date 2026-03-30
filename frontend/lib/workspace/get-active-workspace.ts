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
 * - Personal workspace → owner's plan_tier
 * - Team workspace → workspace owner's plan_tier (billing is tied to the account that created/owns the ws)
 */
export async function getWorkspacePlanTier(ownerId: string): Promise<string> {
  const service = getServiceSupabase()
  const { data: profile } = await service
    .from("profiles")
    .select("plan_tier")
    .eq("id", ownerId)
    .single()
  return (profile?.plan_tier ?? "FREE") as string
}
