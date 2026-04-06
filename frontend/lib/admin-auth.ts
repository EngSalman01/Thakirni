import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { limiters, rateLimitResponse } from "@/lib/rate-limit";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (profile?.is_admin !== true)
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };

  // Rate-limit admin actions: 60 req/min per admin user
  const rl = await limiters.admin(user.id);
  if (!rl.success)
    return { user: null, error: rateLimitResponse(rl.reset) };

  return { user, error: null };
}
