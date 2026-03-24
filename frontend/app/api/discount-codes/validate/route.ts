import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json() as { code?: string; planKey?: string };
  const { code, planKey } = body;

  if (!code) {
    return NextResponse.json({ valid: false, message: "Code is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .select("id, code, discount_percent, max_uses, used_count, expires_at, plan_key, is_active")
    .eq("code", code.toUpperCase().trim())
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
