"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Create column
export async function createColumn(teamId: string, title: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Get max position
    const { data: columns } = await supabase
      .from("task_columns")
      .select("position")
      .eq("team_id", teamId)
      .order("position", { ascending: false })
      .limit(1);

    const position = columns?.[0]?.position ?? 0;

    const { data: column, error } = await supabase
      .from("task_columns")
      .insert({
        team_id: teamId,
        title,
        position: position + 1,
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true, column };
  } catch (error) {
    console.error("Create column error:", error);
    return { error: "Failed to create column" };
  }
}

// Update column
export async function updateColumn(columnId: string, updates: Record<string, any>) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("task_columns")
      .update(updates)
      .eq("id", columnId);

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    console.error("Update column error:", error);
    return { error: "Failed to update column" };
  }
}

// Delete column
export async function deleteColumn(columnId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("task_columns")
      .delete()
      .eq("id", columnId);

    if (error) throw error;
    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    console.error("Delete column error:", error);
    return { error: "Failed to delete column" };
  }
}

// Reorder columns
export async function reorderColumns(columnIds: string[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    for (let i = 0; i < columnIds.length; i++) {
      const { error } = await supabase
        .from("task_columns")
        .update({ position: i })
        .eq("id", columnIds[i]);

      if (error) throw error;
    }

    revalidatePath("/vault");
    return { success: true };
  } catch (error) {
    console.error("Reorder columns error:", error);
    return { error: "Failed to reorder columns" };
  }
}
