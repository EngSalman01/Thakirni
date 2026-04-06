import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const service = createServiceClient()

  const now = new Date()

  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const [logsResult, jobsResult, auditResult] = await Promise.all([
    // Delete request_logs older than 90 days
    service
      .from("request_logs")
      .delete()
      .lt("created_at", ninetyDaysAgo.toISOString()),

    // Delete completed/failed jobs older than 30 days
    service
      .from("jobs")
      .delete()
      .in("status", ["done", "failed"])
      .lt("created_at", thirtyDaysAgo.toISOString()),

    // Delete audit_logs older than 365 days (keep 1 year for legal compliance)
    service
      .from("audit_logs")
      .delete()
      .lt("created_at", oneYearAgo.toISOString()),
  ])

  const errors = [logsResult.error, jobsResult.error, auditResult.error].filter(Boolean)
  if (errors.length > 0) {
    console.error("[data-cleanup] errors:", errors)
  }

  return NextResponse.json({
    deleted: {
      logs: logsResult.error ? null : "ok",
      jobs: jobsResult.error ? null : "ok",
      auditLogs: auditResult.error ? null : "ok",
    },
    errors: errors.map((e) => (e as Error).message),
    ranAt: now.toISOString(),
  })
}
