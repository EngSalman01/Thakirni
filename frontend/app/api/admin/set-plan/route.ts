import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { parseBody, isValidUUID, sanitizeString } from "@/lib/validate";
import { logAuditEvent } from "@/lib/compliance/audit";

const VALID_PLANS = new Set(["free", "pro", "teams"]);
const PLAN_MAP: Record<string, string> = { free: "FREE", pro: "PRO", teams: "TEAMS" };

export async function POST(request: NextRequest) {
  const { user: adminUser, error } = await requireAdmin();
  if (error) return error;

  const [body, parseErr] = await parseBody<Record<string, unknown>>(request, 512);
  if (parseErr) return parseErr;

  const userId = sanitizeString(body.userId, 36);
  const plan = sanitizeString(body.plan, 20)?.toLowerCase();

  if (!userId || !isValidUUID(userId)) {
    return NextResponse.json({ error: "Valid userId (UUID) required" }, { status: 400 });
  }
  if (!plan || !VALID_PLANS.has(plan)) {
    return NextResponse.json({ error: "plan must be free, pro, or teams" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan_tier: PLAN_MAP[plan] })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logAuditEvent(
    adminUser!.id,
    "admin_action",
    `Admin changed plan for user ${userId} to ${PLAN_MAP[plan]}`,
    { targetUserId: userId, newPlan: PLAN_MAP[plan] }
  );

  return NextResponse.json({ success: true, plan: PLAN_MAP[plan] });
}
