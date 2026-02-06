import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This endpoint should be called by Vercel Cron every minute
// Add to vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "* * * * *" }] }

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify cron secret if set
  if (CRON_SECRET && req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const results = {
    reminders: 0,
    tasks: 0,
    errors: 0,
  }

  try {
    // ── Process due reminders ──────────────────────────────────
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("is_active", true)
      .lte("next_reminder_at", now.toISOString())

    for (const reminder of reminders || []) {
      try {
        // Mark reminder as triggered
        let nextReminder: Date | null = null
        const currentTime = new Date(reminder.reminder_time)

        switch (reminder.reminder_type) {
          case "daily":
            nextReminder = new Date(currentTime.setDate(currentTime.getDate() + 1))
            break
          case "weekly":
            nextReminder = new Date(currentTime.setDate(currentTime.getDate() + 7))
            break
          case "monthly":
            nextReminder = new Date(currentTime.setMonth(currentTime.getMonth() + 1))
            break
          case "yearly":
            nextReminder = new Date(currentTime.setFullYear(currentTime.getFullYear() + 1))
            break
        }

        if (
          nextReminder &&
          (!reminder.recurrence_end_date || nextReminder <= new Date(reminder.recurrence_end_date))
        ) {
          await supabase
            .from("reminders")
            .update({
              next_reminder_at: nextReminder.toISOString(),
              last_sent_at: now.toISOString(),
            })
            .eq("id", reminder.id)
        } else {
          // One-time reminder or recurrence ended
          await supabase
            .from("reminders")
            .update({
              is_active: false,
              last_sent_at: now.toISOString(),
            })
            .eq("id", reminder.id)
        }

        results.reminders++
      } catch {
        results.errors++
      }
    }

    // ── Process overdue tasks ──────────────────────────────────
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("status", "pending")
      .lte("due_date", now.toISOString())

    for (const task of tasks || []) {
      try {
        await supabase
          .from("tasks")
          .update({ status: "overdue" })
          .eq("id", task.id)

        results.tasks++
      } catch {
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      processed: results,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error("[Cron Reminders] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
