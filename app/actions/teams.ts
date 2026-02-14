"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Team, TeamMember, TeamRole } from "@/lib/types";

// Team creation
export async function createTeam(name: string, slug: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Check if slug is already taken
    const { data: existingTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingTeam) {
      return { error: "This team name is already taken. Please choose another." };
    }

    // Create team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        name,
        slug,
        owner_id: user.id,
        tier: "starter",
        subscription_status: "active",
      })
      .select()
      .single();

    if (teamError) {
      console.error("Error creating team:", teamError);
      console.error("Team data attempted:", { name, slug, owner_id: user.id });
      return { error: `Failed to create team: ${teamError.message}` };
    }

    // Add creator as owner in team_members
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: "owner",
      });

    if (memberError) {
      console.error("Error adding team owner:", memberError);
      console.error("Member data attempted:", { team_id: team.id, user_id: user.id, role: "owner" });
      // Rollback team creation
      await supabase.from("teams").delete().eq("id", team.id);
      return { error: `Failed to set up team ownership: ${memberError.message}` };
    }

    revalidatePath("/vault/settings/teams");
    return { data: team };
  } catch (error) {
    console.error("Team creation error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Invite team member
export async function inviteMember(
  teamId: string,
  userId: string,
  role: TeamRole = "member"
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Check if user is admin/owner of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return { error: "You don't have permission to invite members" };
    }

    // Get team tier, subscription status, and current member count
    const { data: team } = await supabase
      .from("teams")
      .select("tier, subscription_status")
      .eq("id", teamId)
      .single();

    // Check subscription status
    if (team?.subscription_status !== "active") {
      return {
        error: "Team subscription is inactive. Please renew to add members.",
      };
    }

    const { count } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);

    // Enforce member limit for starter plan
    if (team?.tier === "starter" && count !== null && count >= 5) {
      return {
        error: "Team limit reached. Upgrade to Pro to add more members.",
      };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      return { error: "User is already a member of this team" };
    }

    // Add member
    const { data, error } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inviting member:", error);
      return { error: "Failed to invite member" };
    }

    revalidatePath(`/vault/settings/teams/${teamId}`);
    return { data };
  } catch (error) {
    console.error("Member invitation error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Remove team member
export async function removeMember(teamId: string, userId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Check if user is admin/owner
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return { error: "You don't have permission to remove members" };
    }

    // Prevent removing the owner
    const { data: targetMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single();

    if (targetMember?.role === "owner") {
      return { error: "Cannot remove team owner" };
    }

    // Remove member
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing member:", error);
      return { error: "Failed to remove member" };
    }

    revalidatePath(`/vault/settings/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Member removal error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Update member role
export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Only owners can change roles
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "owner") {
      return { error: "Only team owners can change member roles" };
    }

    // Prevent changing owner role
    const { data: targetMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single();

    if (targetMember?.role === "owner") {
      return { error: "Cannot change owner role" };
    }

    // Update role
    const { error } = await supabase
      .from("team_members")
      .update({ role })
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating role:", error);
      return { error: "Failed to update member role" };
    }

    revalidatePath(`/vault/settings/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Role update error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Get team members with profiles
export async function getTeamMembers(teamId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Verify user is a member and get team info
    const { data: membership } = await supabase
      .from("team_members")
      .select("id, role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { error: "You are not a member of this team" };
    }

    // Get members with profiles
    const { data, error } = await supabase
      .from("team_members")
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching team members:", error);
      return { error: "Failed to fetch team members" };
    }

    return { data, userRole: membership.role };
  } catch (error) {
    console.error("Get team members error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Get team details (for settings page)
export async function getTeamDetails(teamId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Verify user is a member and get their role
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { error: "You are not a member of this team" };
    }

    // Get team details
    const { data: team, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();

    if (error) {
      console.error("Error fetching team details:", error);
      return { error: "Failed to fetch team details" };
    }

    return { data: team, userRole: membership.role };
  } catch (error) {
    console.error("Get team details error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Get user's teams
export async function getUserTeams() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("team_members")
      .select(`
        team_id,
        role,
        team:teams(*)
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user teams:", error);
      return { error: "Failed to fetch teams" };
    }

    return { data };
  } catch (error) {
    console.error("Get user teams error:", error);
    return { error: "An unexpected error occurred" };
  }
}
