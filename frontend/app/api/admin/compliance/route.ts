import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const service = createServiceClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

  const [
    totalUsersResult,
    consentedResult,
    recentAuditResult,
    auditCountsResult,
  ] = await Promise.all([
    // Total user count
    service.from("profiles").select("id", { count: "exact", head: true }),

    // Consented users count
    service
      .from("consent_logs")
      .select("user_id", { count: "exact", head: true })
      .eq("version", "1.0"),

    // Recent audit logs (last 50, all types)
    service
      .from("audit_logs")
      .select("id, user_id, event_type, description, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(50),

    // Counts by event type in last 30 days
    service
      .from("audit_logs")
      .select("event_type")
      .gte("created_at", thirtyDaysAgoISO),
  ])

  const totalUsers = totalUsersResult.count ?? 0
  const consentedCount = consentedResult.count ?? 0
  const coveragePct = totalUsers > 0
    ? Math.round((consentedCount / totalUsers) * 100 * 10) / 10
    : 0

  // Build event type counts from last 30 days
  const eventCounts: Record<string, number> = {}
  for (const row of auditCountsResult.data ?? []) {
    const et = row.event_type as string
    eventCounts[et] = (eventCounts[et] ?? 0) + 1
  }

  return NextResponse.json({
    consent: {
      totalUsers,
      consentedCount,
      withoutConsent: totalUsers - consentedCount,
      coveragePct,
    },
    recentAuditLogs: recentAuditResult.data ?? [],
    eventCountsLast30Days: eventCounts,
  })
}
