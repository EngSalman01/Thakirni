"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
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

    // Create team subscription record for the user
    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        team_id: team.id,
        subscription_type: "team", // Assuming team is created with team subscription
        status: "active",
        plan_name: "Team Starter",
      });

    if (subscriptionError) {
      console.warn("Warning: Failed to create subscription record:", subscriptionError);
      // Non-critical error - team still created successfully
    }

    revalidatePath("/vault/settings/teams");
    return { data: team };
  } catch (error) {
    console.error("Team creation error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Create team invitation
// Create team invitation
export async function createInvitation(
  teamId: string,
  email: string,
  role: TeamRole = "member"
) {
  try {
    const supabase = await createClient();
    
    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return { error: "Unauthorized: Please sign in again." };
    }

    // 2. Refresh permissions (Owner/Admin only)
    const { data: membership, error: memError } = await supabase
      .from("team_members")
      .select("role, teams(name)")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (memError || !membership || !["owner", "admin"].includes(membership.role)) {
      console.error("Permission denied. User:", user.id, "Team:", teamId, "Role:", membership?.role);
      return { error: "You don't have permission to invite members." };
    }

    // 3. Check if user is already a member
    const { data: existingInvite } = await supabase
      .from("team_invitations")
      .select("id, token")
      .eq("team_id", teamId)
      .eq("email", email)
      .single();

    // 4. Create new invitation or get existing
    let token = "";
    
    if (existingInvite) {
      token = existingInvite.token;
      // Update expiration if needed, or just re-send
    } else {
      token = crypto.randomUUID(); // Generate unique token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { error: inviteError } = await supabase
        .from("team_invitations")
        .insert({
          team_id: teamId,
          email,
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        });

      if (inviteError) {
        console.error("Error creating invitation:", inviteError);
        return { error: "Failed to create invitation: " + inviteError.message };
      }
    }

    // 5. Generate Link & Send Email
    // Dynamic Base URL
    const headersList = await headers();
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${origin}/join-team?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { error: emailError } = await resend.emails.send({
        from: 'Thakirni <onboarding@resend.dev>', // Update this if user accepts custom domain
        to: email,
        subject: `You've been invited to join ${(membership.teams as any)?.name} on Thakirni`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You've been invited!</h2>
            <p><strong>${user.email}</strong> has invited you to join the team <strong>${(membership.teams as any)?.name}</strong> on Thakirni.</p>
            <div style="margin: 24px 0;">
              <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Join Team
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Or copy this link: <br> <a href="${inviteLink}">${inviteLink}</a></p>
          </div>
        `
      });

      if (emailError) {
        console.error("Resend error:", emailError);
        // We don't fail the whole action, but notify
        return { success: true, message: "Invitation created, but failed to send email. You can copy the link.", link: inviteLink };
      }
    }

    revalidatePath(`/vault/settings/teams/${teamId}`);
    
    return { 
      success: true, 
      message: "Invitation sent successfully!", 
      link: inviteLink 
    };

  } catch (error) {
    console.error("Invitation error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Old inviteMember function - keeping for compatibility but forwarding to createInvitation
export async function inviteMember(teamId: string, email: string, role: TeamRole = "member") {
    return createInvitation(teamId, email, role);
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
// Get team by slug
export async function getTeamBySlug(slug: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    const { data: team, error } = await supabase
      .from("teams")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Error fetching team by slug:", error);
      return { error: "Team not found" };
    }

    // specific check: implies user must be a member or owner to see it?
    // The RLS policy "View my teams" handles this (owner or member)
    // checking if we can select it essentially checks permission via RLS
    // but explicit check is good for returning specific error

    return { data: team };
  } catch (error) {
    console.error("Get team by slug error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Get team tasks
export async function getTeamTasks(teamId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Verify membership
    const { data: membership, error: memError } = await supabase
      .from("team_members")
      .select("id, role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (memError || !membership) {
      console.error(`[TeamTasks] Membership check failed for User ${user.id} Team ${teamId}`, memError);
      return { error: "You are not a member of this team" };
    }

    const { data, error } = await supabase
      .from("plans")
      .select(`
        *,
        assignee:profiles!assigned_to(full_name, avatar_url)
      `)
      .eq("team_id", teamId)
      .eq("category", "task") // Only tasks for now
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching team tasks:", error);
      return { error: "Failed to fetch tasks" };
    }

    return { data };
  } catch (error) {
    console.error("Get team tasks error:", error);
    return { error: "An unexpected error occurred" };
  }
}
