import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createServiceClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);
  const weekAgoISO = weekAgo.toISOString();

  const [totalResult, planResult, newTodayResult, newWeekResult, whatsappResult] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("plan_tier"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayISO),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgoISO),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .like("phone_number", "966%"),
    ]);

  const total = totalResult.count ?? 0;
  const newToday = newTodayResult.count ?? 0;
  const newThisWeek = newWeekResult.count ?? 0;
  const whatsappActive = whatsappResult.count ?? 0;

  const plans = planResult.data ?? [];
  const planCounts: Record<string, number> = { free: 0, pro: 0, teams: 0, other: 0 };
  for (const row of plans) {
    const tier = (row.plan_tier ?? "free").toLowerCase();
    if (tier === "free" || tier === "individual") planCounts.free++;
    else if (tier === "pro") planCounts.pro++;
    else if (tier === "teams" || tier === "team" || tier === "company") planCounts.teams++;
    else planCounts.other++;
  }

  return NextResponse.json({
    total,
    free: planCounts.free,
    pro: planCounts.pro,
    teams: planCounts.teams,
    newToday,
    newThisWeek,
    whatsappActive,
  });
}
