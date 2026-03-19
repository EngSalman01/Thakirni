"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Create task
export async function createTask(teamId: string, columnId: string, title: string, description?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        team_id: teamId,
        column_id: columnId,
        title,
        description,
        created_by: user.id,
        position: 0,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true, task };
  } catch (error) {
    console.error("Create task error:", error);
    return { error: "Failed to create task" };
  }
}

// Update task
export async function updateTask(taskId: string, updates: Record<string, any>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    console.error("Update task error:", error);
    return { error: "Failed to update task" };
  }
}

// Delete task
export async function deleteTask(taskId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    console.error("Delete task error:", error);
    return { error: "Failed to delete task" };
  }
}

// Move task between columns
export async function moveTask(taskId: string, newColumnId: string, position: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("tasks")
      .update({ column_id: newColumnId, position })
      .eq("id", taskId);

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    console.error("Move task error:", error);
    return { error: "Failed to move task" };
  }
}

// Assign task to user
export async function assignTask(taskId: string, userId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("tasks")
      .update({ assigned_to: userId })
      .eq("id", taskId);

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    console.error("Assign task error:", error);
    return { error: "Failed to assign task" };
  }
}

// Add comment to task
export async function addTaskComment(taskId: string, content: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { data: comment, error } = await supabase
      .from("task_comments")
      .insert({
        task_id: taskId,
        user_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true, comment };
  } catch (error) {
    console.error("Add comment error:", error);
    return { error: "Failed to add comment" };
  }
}
