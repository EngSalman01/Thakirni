import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { trackEvent } from "@/lib/analytics"

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()

  try {
    // Delete all user data in order (children first)
    const tables = [
      "habit_logs",
      "reminders",
      "memories",
      "plans",
      "habits",
      "goals",
      "meeting_summaries",
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
