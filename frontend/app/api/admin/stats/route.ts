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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

  const [
    totalResult,
    planResult,
    newTodayResult,
    newWeekResult,
    whatsappResult,
    subscriptionsResult,
    cancelledResult,
    prevPeriodCancelledResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("plan_tier"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayISO),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgoISO),
    supabase.from("profiles").select("id", { count: "exact", head: true }).like("phone_number", "966%"),
    supabase.from("subscriptions").select("plan_tier, billing_cycle, status").eq("status", "active"),
    // Churn: cancelled in last 30 days
    supabase.from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("updated_at", thirtyDaysAgoISO),
    // Previous period cancellations (30-60 days ago) for churn rate trend
    supabase.from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("updated_at", sixtyDaysAgoISO)
      .lt("updated_at", thirtyDaysAgoISO),
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

  // MRR calculation
  const PRO_MONTHLY_USD = 30;
  const TEAMS_MONTHLY_USD = 60;
  const PRO_ANNUAL_MONTHLY_USD = 24; // $288/yr ÷ 12
  const TEAMS_ANNUAL_MONTHLY_USD = 48; // $576/yr ÷ 12

  let mrr = 0;
  const subs = subscriptionsResult.data ?? [];
  for (const sub of subs) {
    const tier = (sub.plan_tier ?? "").toUpperCase();
    const isAnnual = sub.billing_cycle === "annual";
    if (tier === "PRO")   mrr += isAnnual ? PRO_ANNUAL_MONTHLY_USD   : PRO_MONTHLY_USD;
    if (tier === "TEAMS") mrr += isAnnual ? TEAMS_ANNUAL_MONTHLY_USD  : TEAMS_MONTHLY_USD;
  }

  const activePaidUsers = planCounts.pro + planCounts.teams;
  const cancelledThisPeriod = cancelledResult.count ?? 0;
  const cancelledPrevPeriod = prevPeriodCancelledResult.count ?? 0;
  const churnRate = activePaidUsers > 0
    ? Math.round((cancelledThisPeriod / Math.max(activePaidUsers, 1)) * 100 * 10) / 10
    : 0;
  const conversionRate = total > 0
    ? Math.round((activePaidUsers / total) * 100 * 10) / 10
    : 0;

  const arr = mrr * 12;

  return NextResponse.json({
    total,
    free: planCounts.free,
    pro: planCounts.pro,
    teams: planCounts.teams,
    newToday,
    newThisWeek,
    whatsappActive,
    mrr: Math.round(mrr),
    arr: Math.round(arr),
    churnRate,
    churnTrend: cancelledThisPeriod - cancelledPrevPeriod,
    conversionRate,
    activePaidUsers,
  });
}
