/**
 * Team Service — backend business logic for teams.
 * Called by API routes and server actions. Never imported by client components.
 */
import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";

// ── Get user teams ────────────────────────────────────────────────────────────

export async function getUserTeams(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("team_id, role, team:teams(*)")
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to fetch teams: ${error.message}`);
  return (data ?? []).map((item: any) => item.team).filter(Boolean);
}

// ── Get team members ──────────────────────────────────────────────────────────

export async function getTeamMembers(teamId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("user_id, role, profiles(full_name, avatar_url, email)")
    .eq("team_id", teamId);

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return data ?? [];
}

// ── Invite member ─────────────────────────────────────────────────────────────

export async function inviteTeamMember(teamId: string, email: string, role = "member") {
  const supabase = await createServerClient();

  // Look up user by email
  const { data: users, error: userErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (userErr || !users) throw new Error("User not found with that email");

  const { error } = await supabase.from("team_members").insert({
    team_id: teamId,
    user_id: users.id,
    role,
    joined_at: new Date().toISOString(),
  });

  if (error) throw new Error(`Failed to invite member: ${error.message}`);
}

// ── Create team ───────────────────────────────────────────────────────────────

export async function createTeam(
  ownerId: string,
  payload: { name: string; slug: string; description?: string }
) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("teams")
    .insert({ ...payload, owner_id: ownerId, plan_tier: "FREE", created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw new Error(`Failed to create team: ${error.message}`);

  // Add owner as admin
  await supabase.from("team_members").insert({
    team_id: data.id,
    user_id: ownerId,
    role: "admin",
    joined_at: new Date().toISOString(),
  });

  return data;
}
