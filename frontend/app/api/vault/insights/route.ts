import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface InsightResponse {
  ar: string;
  en: string;
  type: "overdue" | "memory" | "habit" | "plan" | "empty";
}

export async function GET(): Promise<NextResponse<InsightResponse | { error: string }>> {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayRiyadh = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Riyadh",
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // Run all queries in parallel
  const [memoriesResult, plansResult, habitsResult, habitLogsResult, overdueResult] =
    await Promise.all([
      // 1. Last 7 days memories
      supabase
        .from("memories")
        .select("id, tags")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgoISO),

      // 2. Today's plans (pending + done)
      supabase
        .from("plans")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("plan_date", todayRiyadh)
        .in("status", ["pending", "done"]),

      // 3. Active habits
      supabase
        .from("habits")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true),

      // 4. Today's habit completions
      supabase
        .from("habit_logs")
        .select("habit_id")
        .eq("user_id", user.id)
        .eq("log_date", todayRiyadh),

      // 5. Overdue plans
      supabase
        .from("plans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending")
        .lt("plan_date", todayRiyadh),
    ]);

  // --- Process results ---

  // Overdue count
  const overdueCount = overdueResult.count ?? 0;

  // Memories this week + most frequent tag
  const weekMemories = memoriesResult.data ?? [];
  const memoryCount = weekMemories.length;

  let mostFrequentTag: string | null = null;
  if (memoryCount > 0) {
    const tagFreq: Record<string, number> = {};
    for (const mem of weekMemories) {
      const tags = (mem.tags as string[] | null) ?? [];
      for (const tag of tags) {
        tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;
      }
    }
    const sorted = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]);
    mostFrequentTag = sorted[0]?.[0] ?? null;
  }

  // Plans today
  const todayPlans = plansResult.data ?? [];
  const totalPlansToday = todayPlans.length;
  const completedPlansToday = todayPlans.filter((p) => p.status === "done").length;

  // Habits
  const activeHabits = habitsResult.data ?? [];
  const totalActiveHabits = activeHabits.length;
  const completedHabitsIds = new Set((habitLogsResult.data ?? []).map((l) => l.habit_id));
  const completedHabitsToday = activeHabits.filter((h) => completedHabitsIds.has(h.id)).length;

  // --- Build insight ---

  let insight: InsightResponse;

  if (overdueCount > 0) {
    insight = {
      ar: `لديك ${overdueCount} ${overdueCount === 1 ? "مهمة متأخرة" : "مهام متأخرة"}`,
      en: `You have ${overdueCount} overdue ${overdueCount === 1 ? "task" : "tasks"}`,
      type: "overdue",
    };
  } else if (memoryCount > 0) {
    const tagSuffixAr = mostFrequentTag ? ` — أكثر وسم شائع: "${mostFrequentTag}"` : "";
    const tagSuffixEn = mostFrequentTag ? ` — most common tag: "${mostFrequentTag}"` : "";
    insight = {
      ar: `التقطت ${memoryCount} ${memoryCount === 1 ? "ذكرى" : "ذكريات"} هذا الأسبوع${tagSuffixAr}`,
      en: `You captured ${memoryCount} ${memoryCount === 1 ? "memory" : "memories"} this week${tagSuffixEn}`,
      type: "memory",
    };
  } else if (totalActiveHabits > 0 && completedHabitsToday > 0) {
    insight = {
      ar: `أكملت ${completedHabitsToday}/${totalActiveHabits} عادات اليوم`,
      en: `You completed ${completedHabitsToday}/${totalActiveHabits} habits today`,
      type: "habit",
    };
  } else if (completedPlansToday > 0) {
    insight = {
      ar: `أنجزت ${completedPlansToday} ${completedPlansToday === 1 ? "مهمة" : "مهام"} اليوم`,
      en: `You completed ${completedPlansToday} ${completedPlansToday === 1 ? "task" : "tasks"} today`,
      type: "plan",
    };
  } else {
    insight = {
      ar: "ابدأ يومك بتسجيل ذكرى أو إنشاء خطة",
      en: "Start your day by capturing a memory or creating a plan",
      type: "empty",
    };
  }

  return NextResponse.json(insight);
}
