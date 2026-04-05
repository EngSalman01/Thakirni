import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

    const [plansRes, habitRes] = await Promise.all([
      supabase
        .from("plans")
        .select("status")
        .eq("user_id", user.id)
        .eq("plan_date", today),
      supabase
        .from("habits")
        .select("current_streak")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("current_streak", { ascending: false })
        .limit(1),
    ])

    const plans = plansRes.data ?? []
    const done = plans.filter(p => p.status === "done").length
    const total = plans.length
    const topStreak = habitRes.data?.[0]?.current_streak ?? 0

    // Also refresh daily_streak async (fire-and-forget)
    supabase.rpc("refresh_daily_streak", { p_user_id: user.id }).then(undefined, () => {})

    return NextResponse.json({
      done,
      total,
      streak: topStreak,
      allDone: total > 0 && done === total,
    })
  } catch (err) {
    console.error("[daily-progress]", err)
    return NextResponse.json({ done: 0, total: 0, streak: 0, allDone: false })
  }
}
