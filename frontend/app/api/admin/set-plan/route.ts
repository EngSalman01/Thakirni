import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json() as { userId?: string; plan?: string };
  const { userId, plan } = body;

  if (!userId || !plan) {
    return NextResponse.json(
      { error: "userId and plan are required" },
      { status: 400 }
    );
  }

  const validPlans = ["free", "pro", "teams"];
  if (!validPlans.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Map to the stored values in profiles
  const planMap: Record<string, string> = {
    free: "FREE",
    pro: "PRO",
    teams: "COMPANY",
  };

  const supabase = createServiceClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan_tier: planMap[plan] })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, plan: planMap[plan] });
}
