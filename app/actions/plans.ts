"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Update plan status (Quick action)
export async function updatePlanStatus(
  planId: string,
  status: "pending" | "in_progress" | "completed" | "cancelled"
) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    // Update
    const { error } = await supabase
      .from("plans")
      .update({ status })
      .eq("id", planId);

    if (error) throw error;

    revalidatePath("/vault/projects/[id]", "page"); 
    return { success: true };
  } catch (error) {
    console.error("Update plan status error:", error);
    return { error: "Failed to update status" };
  }
}

// General update plan
export async function updatePlan(planId: string, updates: any) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
      .from("plans")
      .update(updates)
      .eq("id", planId);

    if (error) throw error;

    revalidatePath("/vault/projects/[id]", "page");
    return { success: true };
  } catch (error) {
    console.error("Update plan error:", error);
    return { error: "Failed to update plan" };
  }
}
