/**
 * Memory Service — backend business logic for memories.
 * Called by API routes and server actions. Never imported by client components.
 */
import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Memory } from "@/lib/types";

// ── Fetch user memories ───────────────────────────────────────────────────────

export async function getUserMemories(userId: string): Promise<Memory[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch memories: ${error.message}`);
  return (data ?? []) as Memory[];
}

// ── Create memory ─────────────────────────────────────────────────────────────

export async function createMemory(
  userId: string,
  payload: {
    title?: string;
    description?: string;
    content_url: string;
    type: "photo" | "voice" | "text";
    tags?: string[];
    team_id?: string;
    is_shared?: boolean;
  }
): Promise<Memory> {
  const supabase = await createServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("memories")
    .insert({
      user_id: userId,
      ...payload,
      hijri_date: now,
      gregorian_date: now,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create memory: ${error.message}`);
  return data as Memory;
}

// ── Delete memory ─────────────────────────────────────────────────────────────

export async function deleteMemory(userId: string, memoryId: string): Promise<void> {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memoryId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete memory: ${error.message}`);
}

// ── Search memories ───────────────────────────────────────────────────────────

export async function searchMemories(userId: string, query: string): Promise<Memory[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to search memories: ${error.message}`);
  return (data ?? []) as Memory[];
}
