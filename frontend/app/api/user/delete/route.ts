import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { logAuditEvent } from "@/lib/compliance/audit"

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()
  const uid = user.id

  // Log before deletion so the record exists
  await logAuditEvent(uid, "account_deletion", "User initiated account deletion", {
    email: user.email,
  })

  try {
    // Delete in order: children first, parents last
    const tables = [
      "conversations",
      "plans",
      "habits",
      "goals",
      "reminders",
      "user_facts",
      "usage_monthly",
      "usage_daily",
      "consent_logs",
    ]

    for (const table of tables) {
      await service.from(table).delete().eq("user_id", uid)
    }

    // Delete credits (different column name)
    await service.from("credits").delete().eq("user_id", uid)

    // Delete profile
    await service.from("profiles").delete().eq("id", uid)

    // Delete auth user last
    const { error: deleteError } = await service.auth.admin.deleteUser(uid)
    if (deleteError) throw deleteError

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Delete] account deletion error:", err)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
