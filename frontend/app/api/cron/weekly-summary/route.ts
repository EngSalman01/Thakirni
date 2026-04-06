import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"
import { buildViralAppend, logViralCTASent } from "@/lib/growth/viral"

export const maxDuration = 60

interface Profile {
  id: string
  full_name: string | null
  phone_number: string
  preferred_language: string | null
  referral_code: string | null
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const supabase = createServiceClient()

  // Date ranges in Riyadh timezone
  const now = new Date()
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }) // YYYY-MM-DD

  // Last 7 days: from 7 days ago up to (and including) today
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

  // Next 7 days: tomorrow through 7 days from now
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

  const sevenDaysFromNow = new Date(now)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
  const sevenDaysFromNowStr = sevenDaysFromNow.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

  // Fetch all users with a phone number
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, preferred_language, referral_code")
    .not("phone_number", "is", null)

  if (profilesError) {
    console.error("[Cron/WeeklySummary] profiles fetch error:", profilesError.message)
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const profile of profiles as Profile[]) {
    try {
      // 1. Count completed plans this week
      const { count: completedPlans } = await supabase
        .from("plans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("status", "done")
        .gte("plan_date", sevenDaysAgoStr)
        .lte("plan_date", todayStr)

      // 2. Count memories saved this week
      const { count: memoriesCount } = await supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .gte("gregorian_date", sevenDaysAgoStr)
        .lte("gregorian_date", todayStr)

      // 3. Fetch active habits and their completion count this week
      const { data: activeHabits } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", profile.id)
        .eq("is_active", true)

      const totalHabits = activeHabits?.length ?? 0
      let completedHabitLogs = 0

      if (totalHabits > 0) {
        const habitIds = activeHabits!.map((h) => h.id)
        const { count: logsCount } = await supabase
          .from("habit_logs")
          .select("id", { count: "exact", head: true })
          .in("habit_id", habitIds)
          .eq("user_id", profile.id)
          .gte("log_date", sevenDaysAgoStr)
          .lte("log_date", todayStr)

        completedHabitLogs = logsCount ?? 0
      }

      // 4. Count upcoming plans for next 7 days
      const { count: upcomingPlans } = await supabase
        .from("plans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("status", "pending")
        .gte("plan_date", tomorrowStr)
        .lte("plan_date", sevenDaysFromNowStr)

      const donePlans = completedPlans ?? 0
      const memories = memoriesCount ?? 0
      const upcoming = upcomingPlans ?? 0

      // Skip if no activity at all
      if (donePlans === 0 && memories === 0 && completedHabitLogs === 0 && upcoming === 0) {
        continue
      }

      const isArabic = (profile.preferred_language ?? "ar") !== "en"
      const name = profile.full_name ?? (isArabic ? "صديقي" : "there")

      let message: string
      if (isArabic) {
        message = `📊 ملخص أسبوعك يا ${name}!\n\n✅ مهام أنجزتها: ${donePlans}\n🧠 ذكريات حفظتها: ${memories}\n🔥 عادات هذا الأسبوع: ${completedHabitLogs}/${totalHabits}\n📅 مواعيد الأسبوع القادم: ${upcoming}\n\nأسبوع جديد مبارك! 🌟`
      } else {
        message = `📊 Your weekly summary, ${name}!\n\n✅ Tasks completed: ${donePlans}\n🧠 Memories saved: ${memories}\n🔥 Habits this week: ${completedHabitLogs}/${totalHabits}\n📅 Next week's plans: ${upcoming}\n\nHave a great week! 🌟`
      }

      // Append viral CTA if eligible (weekly summary is a perfect value moment)
      if (profile.referral_code) {
        const viralAppend = await buildViralAppend(profile.id, profile.referral_code, isArabic)
        if (viralAppend) {
          message += viralAppend
          logViralCTASent(profile.id).catch(() => {})
        }
      }

      await sendWhatsAppMessage(profile.phone_number, message)
      sent++
    } catch (err) {
      console.error(`[Cron/WeeklySummary] failed for user ${profile.id}:`, err)
    }
  }

  return NextResponse.json({ sent })
}
