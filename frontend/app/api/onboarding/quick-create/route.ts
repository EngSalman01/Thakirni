/**
 * Quick-create: auto-creates the user's first meaningful item during onboarding.
 * This is the "aha moment" — user sees something real created for them in < 2 min.
 *
 * Strategy:
 *   tasks / goals  → create a "مهمة اليوم" plan for today
 *   reminders      → create a reminder for +2h from now
 *   meetings       → create a meeting plan for today
 *   habits         → create a health/routine plan
 *   notes          → create a sample memory note
 *   (default)      → create a task
 *
 * Also: marks `created_first_task` + `saw_first_value` onboarding milestones.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"

interface QuickCreateResult {
  type: "task" | "reminder" | "note"
  title: string
  emoji: string
  titleAr: string
  titleEn: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await limiters.api(user.id)
    if (!rl.success) return rateLimitResponse(rl.reset)

    const body = await req.json() as { useCases?: string[]; name?: string; isArabic?: boolean }
    const useCases: string[] = body.useCases ?? []

    const tz = "Asia/Riyadh"
    const todayDate = new Date().toLocaleDateString("en-CA", { timeZone: tz })

    let result: QuickCreateResult

    // ── Prioritized use-case selection ─────────────────────────────────────
    if (useCases.includes("reminders")) {
      // Create a reminder 2 hours from now
      const remindAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      await supabase.from("reminders").insert({
        user_id: user.id,
        title: "تذكير تجريبي — جرب تعديله أو حذفه",
        remind_at: remindAt,
        channel: "whatsapp",
        is_sent: false,
      })
      result = {
        type: "reminder",
        emoji: "⏰",
        title: "تذكير بعد ساعتين",
        titleAr: "تذكير بعد ساعتين",
        titleEn: "Reminder in 2 hours",
      }
    } else if (useCases.includes("meetings")) {
      await supabase.from("plans").insert({
        user_id: user.id,
        title: "اجتماع تجريبي",
        category: "meeting",
        plan_date: todayDate,
        status: "pending",
        priority: "medium",
      })
      result = {
        type: "task",
        emoji: "📅",
        title: "اجتماع تجريبي",
        titleAr: "اجتماع تجريبي",
        titleEn: "Sample meeting",
      }
    } else if (useCases.includes("habits")) {
      await supabase.from("plans").insert({
        user_id: user.id,
        title: "رياضة اليوم 💪",
        category: "health",
        plan_date: todayDate,
        status: "pending",
        priority: "medium",
      })
      result = {
        type: "task",
        emoji: "💪",
        title: "رياضة اليوم",
        titleAr: "رياضة اليوم 💪",
        titleEn: "Today's workout 💪",
      }
    } else {
      // Default: tasks / goals / notes → create a task
      await supabase.from("plans").insert({
        user_id: user.id,
        title: "أول مهمة لك — جرب تكملها اليوم ✅",
        category: "task",
        plan_date: todayDate,
        status: "pending",
        priority: "high",
      })
      result = {
        type: "task",
        emoji: "✅",
        title: "أول مهمة لك",
        titleAr: "أول مهمة لك — جرب تكملها اليوم ✅",
        titleEn: "Your first task — try completing it today ✅",
      }
    }

    // ── Mark activation milestones ──────────────────────────────────────────
    await supabase.rpc("mark_onboarding_step", { p_user_id: user.id, p_step: "created_first_task" })
    await supabase.rpc("mark_onboarding_step", { p_user_id: user.id, p_step: "saw_first_value" })

    // ── Log analytics event ─────────────────────────────────────────────────
    supabase.from("analytics_events").insert({
      user_id: user.id,
      event_name: "plan_created",
      properties: { source: "onboarding_quick_create", type: result.type },
    }).then(undefined, () => {})

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error("[onboarding/quick-create]", err)
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 })
  }
}
