import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { limiters, rateLimitResponse } from "@/lib/rate-limit";
import { parseBody, sanitizeString, getClientIp } from "@/lib/validate";

export async function POST(req: NextRequest) {
  // Rate-limit by IP — prevents code enumeration
  const ip = getClientIp(req);
  const rl = await limiters.form(ip);
  if (!rl.success) return rateLimitResponse(rl.reset);

  const [body, parseErr] = await parseBody<Record<string, unknown>>(req, 2048);
  if (parseErr) return parseErr;

  const code = sanitizeString(body.code, 50);
  const planKey = sanitizeString(body.planKey, 50);

  if (!code) {
    return NextResponse.json({ valid: false, message: "Code is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("id, code, discount_percent, max_uses, used_count, expires_at, plan_key, is_active")
    .eq("code", code.toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ valid: false, message: "Invalid code" });
  }

  if (!data.is_active) {
    return NextResponse.json({ valid: false, message: "Code is no longer active" });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, message: "Code has expired" });
  }

  if (data.max_uses > 0 && data.used_count >= data.max_uses) {
    return NextResponse.json({ valid: false, message: "Code has reached its usage limit" });
  }

  if (data.plan_key && planKey && data.plan_key !== planKey) {
    return NextResponse.json({ valid: false, message: `Code is only valid for the ${data.plan_key} plan` });
  }

  return NextResponse.json({
    valid: true,
    discountPercent: data.discount_percent,
    codeId: data.id,
  });
}
