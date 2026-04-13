import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { limiters, rateLimitResponse } from "@/lib/rate-limit";
import { parseBody, sanitizeString } from "@/lib/validate";

export async function POST(req: NextRequest) {
  // Must be authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate-limit authenticated user — prevents rapid code cycling
  const rl = await limiters.api(user.id);
  if (!rl.success) return rateLimitResponse(rl.reset);

  const [body, parseErr] = await parseBody<Record<string, unknown>>(req, 2048);
  if (parseErr) return parseErr;

  const code = sanitizeString(body.code, 50);
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const service = createServiceClient();

  // Re-validate before incrementing (prevents double-use from race)
  const { data } = await service
    .from("discount_codes")
    .select("id, max_uses, used_count, is_active, expires_at")
    .eq("code", code.toUpperCase())
    .single();

  if (!data || !data.is_active) return NextResponse.json({ success: false });
  if (data.expires_at && new Date(data.expires_at) < new Date()) return NextResponse.json({ success: false });
  if (data.max_uses > 0 && data.used_count >= data.max_uses) return NextResponse.json({ success: false });

  // Atomic increment with optimistic lock — only updates if used_count hasn't changed
  const { data: updated } = await service
    .from("discount_codes")
    .update({ used_count: data.used_count + 1 })
    .eq("id", data.id)
    .eq("used_count", data.used_count) // prevents TOCTOU race condition
    .select("id");

  if (!updated || updated.length === 0) return NextResponse.json({ success: false }); // concurrent use won the race

  return NextResponse.json({ success: true });
}
