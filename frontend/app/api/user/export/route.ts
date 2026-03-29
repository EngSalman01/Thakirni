import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/compliance/audit"

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()
  const uid = user.id

  const [
    profileResult,
    conversationsResult,
    plansResult,
    habitsResult,
    goalsResult,
    remindersResult,
    userFactsResult,
    usageMonthlyResult,
    consentLogsResult,
  ] = await Promise.all([
    service.from("profiles").select("*").eq("id", uid).single(),
    service.from("conversations").select("*").eq("user_id", uid),
    service.from("plans").select("*").eq("user_id", uid),
    service.from("habits").select("*").eq("user_id", uid),
    service.from("goals").select("*").eq("user_id", uid),
    service.from("reminders").select("*").eq("user_id", uid),
    service.from("user_facts").select("*").eq("user_id", uid),
    service.from("usage_monthly").select("*").eq("user_id", uid),
    service.from("consent_logs").select("*").eq("user_id", uid),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: uid,
      email: user.email,
    },
    profile: profileResult.data ?? null,
    conversations: conversationsResult.data ?? [],
    plans: plansResult.data ?? [],
    habits: habitsResult.data ?? [],
    goals: goalsResult.data ?? [],
    reminders: remindersResult.data ?? [],
    userFacts: userFactsResult.data ?? [],
    usageMonthly: usageMonthlyResult.data ?? [],
    consentLogs: consentLogsResult.data ?? [],
  }

  // Log the export event (fire-and-forget)
  await logAuditEvent(uid, "data_export", "User exported their data", {
    tables: ["profiles", "conversations", "plans", "habits", "goals", "reminders", "user_facts", "usage_monthly", "consent_logs"],
  })

  const json = JSON.stringify(exportData, null, 2)

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="thakirni-data-export.json"',
    },
  })
}
