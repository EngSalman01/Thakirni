import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  sendReminderNotification,
  sendTaskReminder,
  sendMeetingReminder,
} from "@/lib/whatsapp"

// This endpoint should be called by Vercel Cron every minute
// Add to vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "* * * * *" }] }

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET

// Create admin supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Verify cron secret if set
  if (CRON_SECRET && req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const results = {
    reminders: 0,
    tasks: 0,
    meetings: 0,
    errors: 0,
  }

  try {
    // Process due reminders
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*, whatsapp_connections!inner(phone_number)")
      .eq("is_active", true)
      .lte("next_reminder_at", now.toISOString())
      .not("whatsapp_number", "is", null)

    for (const reminder of reminders || []) {
      try {
        const sent = await sendReminderNotification(
          reminder.whatsapp_number,
          reminder.title,
          reminder.description,
          reminder.id
        )

        if (sent) {
          results.reminders++

          // Update next reminder time based on recurrence
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

          if (nextReminder && (!reminder.recurrence_end_date || nextReminder <= new Date(reminder.recurrence_end_date))) {
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
        }
      } catch {
        results.errors++
      }
    }

    // Process due tasks (remind X minutes before due)
    const taskWindow = new Date(now.getTime() + 30 * 60 * 1000) // 30 min window
    const { data: tasks } = await supabase
      .from("tasks")
      .select(`
        *,
        users:user_id (
          whatsapp_connections (phone_number, is_verified)
        )
      `)
      .eq("status", "pending")
      .eq("whatsapp_reminder", true)
      .gte("due_date", now.toISOString())
      .lte("due_date", taskWindow.toISOString())

    for (const task of tasks || []) {
      try {
        const connection = task.users?.whatsapp_connections?.[0]
        if (connection?.is_verified && connection?.phone_number) {
          const sent = await sendTaskReminder(
            connection.phone_number,
            task.title,
            new Date(task.due_date),
            task.id
          )

          if (sent) {
            results.tasks++
            // Mark that reminder was sent
            await supabase
              .from("tasks")
              .update({ whatsapp_reminder: false })
              .eq("id", task.id)
          }
        }
      } catch {
        results.errors++
      }
    }

    // Process upcoming meetings (remind X minutes before)
    const meetingWindow = new Date(now.getTime() + 15 * 60 * 1000) // 15 min window
    const { data: meetings } = await supabase
      .from("meetings")
      .select(`
        *,
        users:user_id (
          whatsapp_connections (phone_number, is_verified)
        )
      `)
      .eq("whatsapp_reminder", true)
      .gte("start_time", now.toISOString())
      .lte("start_time", meetingWindow.toISOString())

    for (const meeting of meetings || []) {
      try {
        const connection = meeting.users?.whatsapp_connections?.[0]
        if (connection?.is_verified && connection?.phone_number) {
          const sent = await sendMeetingReminder(
            connection.phone_number,
            meeting.title,
            new Date(meeting.start_time),
            meeting.location,
            meeting.meeting_url,
            meeting.id
          )

          if (sent) {
            results.meetings++
            // Mark that reminder was sent
            await supabase
              .from("meetings")
              .update({ whatsapp_reminder: false })
              .eq("id", meeting.id)
          }
        }
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
