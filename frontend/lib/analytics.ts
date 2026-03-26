import * as Sentry from "@sentry/nextjs"

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

interface EventData {
  [key: string]: string | number | boolean | undefined
}

export function trackEvent(name: EventName, data?: EventData) {
  try {
    Sentry.addBreadcrumb({
      category: "user_action",
      message: name,
      data,
      level: "info",
    })

    // Also capture as a custom metric
    ;(Sentry as unknown as { metrics?: { increment: (key: string, value: number, opts?: object) => void } })
      .metrics?.increment(`thakirni.${name}`, 1, {
        tags: data as Record<string, string | number | boolean> | undefined,
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
