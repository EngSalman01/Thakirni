"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Project } from "@/lib/types";

// Create project
export async function createProject(
  teamId: string,
  name: string,
  description?: string,
  color: string = "#10b981"
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Verify user is a team member
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { error: "You are not a member of this team" };
    }

    // Create project
    const { data, error } = await supabase
      .from("projects")
      .insert({
        team_id: teamId,
        name,
        description,
        color,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return { error: "Failed to create project" };
    }

    revalidatePath(`/vault/settings/teams/${teamId}`);
    return { data };
  } catch (error) {
    console.error("Project creation error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Update project
export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, "id" | "team_id" | "created_by" | "created_at">>
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Get project to verify team membership
    const { data: project } = await supabase
      .from("projects")
      .select("team_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return { error: "Project not found" };
    }

    // Verify user is admin/owner
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", project.team_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return { error: "You don't have permission to update this project" };
    }

    // Update project
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return { error: "Failed to update project" };
    }

    revalidatePath(`/vault/projects/${projectId}`);
    revalidatePath(`/vault/settings/teams/${project.team_id}`);
    return { data };
  } catch (error) {
    console.error("Project update error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Delete project
export async function deleteProject(projectId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Get project to verify team membership
    const { data: project } = await supabase
      .from("projects")
      .select("team_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return { error: "Project not found" };
    }

    // Verify user is admin/owner
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", project.team_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return { error: "You don't have permission to delete this project" };
    }

    // Delete project (cascades to plans via ON DELETE SET NULL)
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Error deleting project:", error);
      return { error: "Failed to delete project" };
    }

    revalidatePath(`/vault/settings/teams/${project.team_id}`);
    return { success: true };
  } catch (error) {
    console.error("Project deletion error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Get project tasks with assignee data
export async function getProjectTasks(projectId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Get project to verify team membership
    const { data: project } = await supabase
      .from("projects")
      .select("team_id, name, description, color")
      .eq("id", projectId)
      .single();

    if (!project) {
      return { error: "Project not found" };
    }

    // Verify user is a team member
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", project.team_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { error: "You are not a member of this team" };
    }

    // Check team subscription status
    const { data: team } = await supabase
      .from("teams")
      .select("subscription_status")
      .eq("id", project.team_id)
      .single();

    if (team?.subscription_status !== "active") {
      return {
        error: "Team subscription is inactive. Cannot access project tasks.",
      };
    }

    // Get tasks with assignee profiles
    const { data: tasks, error } = await supabase
      .from("plans")
      .select(`
        *,
        assignee:profiles!plans_assigned_to_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching project tasks:", error);
      return { error: "Failed to fetch project tasks" };
    }

    return { data: { project, tasks } };
  } catch (error) {
    console.error("Get project tasks error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Get team projects
export async function getTeamProjects(teamId: string) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "Unauthorized" };
    }

    // Verify user is a team member
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return { error: "You are not a member of this team" };
    }

    // Get projects
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching team projects:", error);
      return { error: "Failed to fetch team projects" };
    }

    return { data };
  } catch (error) {
    console.error("Get team projects error:", error);
    return { error: "An unexpected error occurred" };
  }
}
