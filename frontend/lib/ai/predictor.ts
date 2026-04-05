/**
 * Predictive AI — detects behavioral patterns and triggers proactive nudges.
 *
 * Detects:
 *   delayed_task      — same task postponed ≥ 2 days in a row
 *   gym_skip          — user has gym routine in memory but no gym plan this week
 *   inactivity        — user hasn't interacted in > 48 hours
 *   overdue_batch     — user has ≥ 3 overdue tasks
 *   upgrade_prompt    — user's monthly usage ≥ 80%
 */

import { createClient } from "@supabase/supabase-js"

export type InsightType =
  | "delayed_task"
  | "gym_skip"
  | "inactivity"
  | "overdue_batch"
  | "upgrade_prompt"

export interface PredictiveInsight {
  type: InsightType
  payload: Record<string, unknown>
  messageAr: string
  messageEn: string
}

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Run all predictive checks for a user and return actionable insights.
 * At most one insight per type is returned per call.
 */
export async function detectPredictiveOpportunities(
  userId: string,
  workspaceId: string | null,
  opts: { usageRatio?: number } = {}
): Promise<PredictiveInsight[]> {
  const service = getService()
  const insights: PredictiveInsight[] = []
  const riyadhDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

  // ── 1. Overdue batch ─────────────────────────────────────────────────────
  const { data: overdue } = await service
    .from("plans")
    .select("id, title")
    .eq("user_id", userId)
    .eq("status", "pending")
    .lt("plan_date", riyadhDate)
    .limit(10)

  const overdueCount = (overdue ?? []).length
  if (overdueCount >= 3) {
    insights.push({
      type: "overdue_batch",
      payload: { count: overdueCount },
      messageAr: `عندك ${overdueCount} مهام متأخرة 👀 تبغى أرتبها لك؟`,
      messageEn: `You have ${overdueCount} overdue tasks 👀 Want me to sort them out?`,
    })
  }

  // ── 2. Delayed task (same task pending > 2 days past due) ────────────────
  if (overdueCount === 0 && overdue && overdue.length > 0) {
    const firstOverdue = overdue[0] as { title: string }
    insights.push({
      type: "delayed_task",
      payload: { title: firstOverdue.title },
      messageAr: `ترى "${firstOverdue.title}" باقي معلقة 👀 تبغى تخلصها اليوم؟`,
      messageEn: `"${firstOverdue.title}" is still pending 👀 Want to knock it out today?`,
    })
  }

  // ── 3. Gym skip (has gym routine in memory but no gym plan this week) ────
  const { data: gymMemory } = await service
    .from("user_memory")
    .select("value")
    .eq("user_id", userId)
    .eq("key", "gym_routine")
    .single()

  if (gymMemory) {
    // Check if user has a gym/health plan in the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })
    const { data: gymPlans } = await service
      .from("plans")
      .select("id")
      .eq("user_id", userId)
      .eq("category", "health")
      .gte("plan_date", weekAgo)
      .limit(1)

    if (!gymPlans || gymPlans.length === 0) {
      insights.push({
        type: "gym_skip",
        payload: {},
        messageAr: `دايم تأجل النادي 👀 تبغاني أحط لك وقت ثابت هالأسبوع؟`,
        messageEn: `Looks like the gym's been on hold 👀 Want me to lock in a time this week?`,
      })
    }
  }

  // ── 4. Inactivity (> 48 hours since last conversation) ──────────────────
  const { data: lastConv } = await service
    .from("conversations")
    .select("created_at")
    .eq("user_id", userId)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (lastConv) {
    const hoursSince = (Date.now() - new Date(lastConv.created_at).getTime()) / (1000 * 60 * 60)
    if (hoursSince > 48) {
      insights.push({
        type: "inactivity",
        payload: { hours: Math.round(hoursSince) },
        messageAr: `مرت فترة ما شفتك 👋 كل شي تمام؟`,
        messageEn: `Haven't heard from you in a while 👋 Everything good?`,
      })
    }
  }

  // ── 5. Upgrade prompt (usage >= 80%) ────────────────────────────────────
  const ratio = opts.usageRatio ?? 0
  if (ratio >= 0.80) {
    const pct = Math.round(ratio * 100)
    insights.push({
      type: "upgrade_prompt",
      payload: { usagePct: pct },
      messageAr: `استخدمت ${pct}% من رصيدك الشهري 👀 الترقية توفر لك أضعاف ذلك`,
      messageEn: `You've used ${pct}% of your monthly quota 👀 Upgrading gives you way more room`,
    })
  }

  return insights
}

/**
 * Record that an insight was sent (prevents spamming the same nudge).
 */
export async function markInsightSent(
  userId: string,
  type: InsightType,
  payload: Record<string, unknown>
): Promise<void> {
  const service = getService()
  await service.from("predictive_insights").insert({
    user_id: userId,
    insight_type: type,
    payload,
    sent_at: new Date().toISOString(),
  })
}

/**
 * Check if a particular insight type was already sent in the last N hours.
 */
export async function wasInsightRecentlySent(
  userId: string,
  type: InsightType,
  withinHours = 24
): Promise<boolean> {
  const service = getService()
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString()
  const { data } = await service
    .from("predictive_insights")
    .select("id")
    .eq("user_id", userId)
    .eq("insight_type", type)
    .gte("sent_at", since)
    .limit(1)
  return (data ?? []).length > 0
}
