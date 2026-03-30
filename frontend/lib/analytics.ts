import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/client"

type EventName =
  | "memory_created"
  | "memory_deleted"
  | "plan_created"
  | "plan_completed"
  | "habit_logged"
  | "goal_created"
  | "goal_completed"
  | "meeting_uploaded"
  | "document_uploaded"
  | "voice_note_recorded"
  | "calendar_connected"
  | "subscription_upgraded"
  | "search_performed"
  | "pdf_exported"
  | "account_deleted"
  | "ai_chat_sent"
  | "onboarding_completed"
  | "whatsapp_welcome_sent"
  | "referral_link_copied"
  | "referral_signup"

interface EventData {
  [key: string]: string | number | boolean | undefined
}

export function trackEvent(name: EventName, data?: EventData) {
  try {
    // Sentry breadcrumb (existing behaviour)
    Sentry.addBreadcrumb({
      category: "user_action",
      message: name,
      data,
      level: "info",
    })

    ;(Sentry as unknown as { metrics?: { increment: (key: string, value: number, opts?: object) => void } })
      .metrics?.increment(`thakirni.${name}`, 1, {
        tags: data as Record<string, string | number | boolean> | undefined,
      })

    // Persist to analytics_events table (fire-and-forget)
    const supabase = createClient()
    supabase.from("analytics_events").insert({
      event_name: name,
      properties: data ?? {},
    }).then(({ error }) => {
      if (error) console.warn("[analytics] insert failed:", error.message)
    })
  } catch {
    // Never let analytics crash the app
  }
}

export function identifyUser(userId: string, email?: string) {
  try {
    Sentry.setUser({ id: userId, email })
  } catch {
    // ignore
  }
}

export function clearUser() {
  try {
    Sentry.setUser(null)
  } catch {
    // ignore
  }
}
