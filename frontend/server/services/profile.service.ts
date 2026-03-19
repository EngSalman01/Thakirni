/**
 * Profile Service — backend business logic for user profiles.
 * Called by API routes and server actions. Never imported by client components.
 */
import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface ProfilePayload {
  full_name?: string;
  phone_number?: string | null;
  notification_email?: boolean;
  notification_push?: boolean;
  notification_friday?: boolean;
  avatar_url?: string | null;
}

// ── Get profile ───────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
  return data;
}

// ── Update profile ────────────────────────────────────────────────────────────

export async function updateProfile(userId: string, payload: ProfilePayload) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return data;
}
