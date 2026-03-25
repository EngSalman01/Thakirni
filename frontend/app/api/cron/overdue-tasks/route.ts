import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader?.toLowerCase() !== `bearer ${process.env.CRON_SECRET?.toLowerCase()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Get today's date in Riyadh timezone
  const now = new Date()
  const todayRiyadh = now.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }) // YYYY-MM-DD

  // Fetch all pending plans strictly before today (overdue)
  const { data: overduePlans, error } = await supabase
    .from("plans")
    .select("user_id, title")
    .eq("status", "pending")
    .lt("plan_date", todayRiyadh)
    .limit(500)

  if (error) {
    console.error("[Cron/OverdueTasks] fetch error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!overduePlans || overduePlans.length === 0) {
    return NextResponse.json({ notified: 0 })
  }

  // Fetch profiles for all affected users in one query
  const userIds = [...new Set(overduePlans.map((p) => p.user_id))]
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, phone_number, preferred_language")
    .in("id", userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  // Group by user_id
  const byUser = new Map<
    string,
    { phone: string; isArabic: boolean; titles: string[] }
  >()

  for (const plan of overduePlans) {
    const profile = profileMap.get(plan.user_id)

    if (!profile?.phone_number) continue

    const existing = byUser.get(plan.user_id)
    if (existing) {
      existing.titles.push(plan.title)
    } else {
      byUser.set(plan.user_id, {
        phone: profile.phone_number,
        isArabic: (profile.preferred_language ?? "ar") !== "en",
        titles: [plan.title],
      })
    }
  }

  let notified = 0

  for (const [userId, { phone, isArabic, titles }] of byUser) {
    try {
      const count = titles.length
      const titleList = titles.map((t) => `• ${t}`).join("\n")

      let message: string
      if (isArabic) {
        message = `⚠️ عندك ${count} مهام متأخرة من أمس أو قبله:\n${titleList}\n\nتبي تعيد جدولتها؟ 📅`
      } else {
        message = `⚠️ You have ${count} overdue task(s) from yesterday or earlier:\n${titleList}\n\nWant to reschedule them? 📅`
      }

      await sendWhatsAppMessage(phone, message)
      notified++
    } catch (err) {
      console.error(`[Cron/OverdueTasks] failed for user ${userId}:`, err)
    }
  }

  return NextResponse.json({ notified })
}
