import { createServiceClient } from "@/lib/supabase/server";

// To make yourself admin, run in Supabase SQL Editor:
// UPDATE profiles SET is_admin = true WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();
    if (error || !data) {
      console.error("[isAdmin] query error or no data:", error, data);
      return false;
    }
    return data.is_admin === true;
  } catch (e) {
    console.error("[isAdmin] caught exception:", e);
    return false;
  }
}
