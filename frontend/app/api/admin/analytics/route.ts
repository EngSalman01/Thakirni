/**
 * Admin analytics API.
 * Returns:
 *   - Activation rate
 *   - Day-1 and Day-7 retention
 *   - Feature usage breakdown (last 30 days)
 *   - Top events
 *   - Upgrade conversion
 */

import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createServiceClient()
  const now = new Date()
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })
  const day1ago  = new Date(now.getTime() - 1  * 24 * 60 * 60 * 1000).toISOString()
  const day7ago  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()
  const day30ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    totalUsersResult,
    activatedResult,
    newYesterdayResult,
    activeDay1Result,
    newWeekAgoResult,
    activeDay7Result,
    featureUsageResult,
    topEventsResult,
    upgradesResult,
    memoryStoreResult,
    nudgesSentResult,
  ] = await Promise.all([
    // Total users
    supabase.from("profiles").select("id", { count: "exact", head: true }),

    // Activated users (completed activation)
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_activated", true),

    // New users yesterday (for day-1 cohort)
    supabase.from("profiles")
      .select("id")
      .gte("created_at", day1ago)
      .lt("created_at", today),

    // Of those new yesterday, how many had an ai_chat_sent event today (day-1 retention)
    supabase.from("analytics_events")
      .select("user_id")
      .eq("event_name", "ai_chat_sent")
      .gte("created_at", day1ago),

    // New users 7 days ago (for day-7 cohort base)
    supabase.from("profiles")
      .select("id")
      .gte("created_at", day7ago)
      .lt("created_at", new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()),

    // Active in last 7 days
    supabase.from("analytics_events")
      .select("user_id")
      .eq("event_name", "ai_chat_sent")
      .gte("created_at", day7ago),

    // Feature usage counts (last 30 days)
    supabase.from("analytics_events")
      .select("event_name")
      .gte("created_at", day30ago),

    // Top 10 events by count
    supabase.from("analytics_events")
      .select("event_name")
      .gte("created_at", day30ago)
      .limit(500),

    // Subscription upgrades (last 30 days)
    supabase.from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", "subscription_upgraded")
      .gte("created_at", day30ago),

    // Memory items stored (last 30 days)
    supabase.from("user_memory")
      .select("id", { count: "exact", head: true })
      .gte("created_at", day30ago),

    // Predictive nudges sent (last 30 days)
    supabase.from("predictive_insights")
      .select("id", { count: "exact", head: true })
      .gte("created_at", day30ago)
      .not("sent_at", "is", null),
  ])

  const totalUsers = totalUsersResult.count ?? 0
  const activatedUsers = activatedResult.count ?? 0
  const activationRate = totalUsers > 0 ? Math.round((activatedUsers / totalUsers) * 100) : 0

  // Day-1 retention: % of yesterday's signups active today
  const newYesterdayIds = new Set((newYesterdayResult.data ?? []).map((r: { id: string }) => r.id))
  const activeDay1Ids   = new Set((activeDay1Result.data ?? []).map((r: { user_id: string }) => r.user_id))
  const day1Cohort = newYesterdayIds.size
  const day1Active = [...newYesterdayIds].filter(id => activeDay1Ids.has(id)).length
  const day1Retention = day1Cohort > 0 ? Math.round((day1Active / day1Cohort) * 100) : null

  // Day-7 retention
  const newWeekAgoIds = new Set((newWeekAgoResult.data ?? []).map((r: { id: string }) => r.id))
  const activeDay7Ids = new Set((activeDay7Result.data ?? []).map((r: { user_id: string }) => r.user_id))
  const day7Cohort = newWeekAgoIds.size
  const day7Active = [...newWeekAgoIds].filter(id => activeDay7Ids.has(id)).length
  const day7Retention = day7Cohort > 0 ? Math.round((day7Active / day7Cohort) * 100) : null

  // Feature usage breakdown
  const eventCounts: Record<string, number> = {}
  for (const row of featureUsageResult.data ?? []) {
    const e = (row as { event_name: string }).event_name
    eventCounts[e] = (eventCounts[e] ?? 0) + 1
  }

  const topEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    overview: {
      totalUsers,
      activatedUsers,
      activationRate,
    },
    retention: {
      day1: { cohortSize: day1Cohort, active: day1Active, rate: day1Retention },
      day7: { cohortSize: day7Cohort, active: day7Active, rate: day7Retention },
    },
    featureUsage: {
      aiChats:         eventCounts["ai_chat_sent"] ?? 0,
      memoriesCreated: eventCounts["memory_created"] ?? 0,
      plansCreated:    eventCounts["plan_created"] ?? 0,
      voiceNotes:      eventCounts["voice_note_recorded"] ?? 0,
      documentsUploaded: eventCounts["document_uploaded"] ?? 0,
      calendarConnects:  eventCounts["calendar_connected"] ?? 0,
    },
    monetization: {
      upgrades: upgradesResult.count ?? 0,
    },
    intelligence: {
      memoryItemsStored: memoryStoreResult.count ?? 0,
      predictiveNudgesSent: nudgesSentResult.count ?? 0,
    },
    topEvents,
    generatedAt: new Date().toISOString(),
  })
}
