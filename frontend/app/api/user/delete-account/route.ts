import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { trackEvent } from "@/lib/analytics"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/validate"

export async function DELETE(req: NextRequest) {
  // Brute-force / replay guard: 5 attempts per hour per IP
  const ip = getClientIp(req)
  const ipRl = await limiters.destroy(ip)
  if (!ipRl.success) return rateLimitResponse(ipRl.reset)

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Per-user destroy limit
  const userRl = await limiters.destroy(user.id)
  if (!userRl.success) return rateLimitResponse(userRl.reset)

  const service = createServiceClient()

  try {
    // Delete all user data in order (children first, parents last)
    const tables = [
      "habit_logs",
      "goal_milestones",
      "reminders",
      "focus_sessions",
      "timeline_events",
      "notifications",
      "user_facts",
      "conversations",
      "documents",
      "memories",
      "meetings",
      "whatsapp_messages",
      "whatsapp_connections",
      "subscriptions",
      "plans",
      "habits",
      "goals",
      "team_invitations",
    ]

    trackEvent("account_deleted")

    for (const table of tables) {
      await service.from(table).delete().eq("user_id", user.id)
    }

    // Remove from team members
    await service.from("team_members").delete().eq("user_id", user.id)

    // Delete profile (will cascade to related)
    await service.from("profiles").delete().eq("id", user.id)

    // Delete auth user (must be last)
    const { error: deleteError } = await service.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[Delete Account] error:", err)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
