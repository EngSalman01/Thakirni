// app/api/cron/health-nudges/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/cron-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

function isQuietHours(): boolean {
  const hour = parseInt(
    new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour12: false }).slice(0, 2)
  )
  return hour >= 23 || hour < 7
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  if (isQuietHours()) return NextResponse.json({ skipped: "quiet_hours" })

  const supabase = createServiceClient()
  const todayDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })

  const { data: subs } = await supabase
    .from("health_nudge_subscriptions")
    .select("user_id, phone")
    .eq("enabled", true)

  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 })

  const userIds = subs.map(s => s.user_id as string)
  const { data: logs } = await supabase
    .from("health_logs")
    .select("user_id, water_cups, steps, sleep_hours")
    .eq("date", todayDate)
    .in("user_id", userIds)

  const logByUser = new Map((logs ?? []).map(l => [l.user_id as string, l]))

  let sent = 0
  for (const sub of subs) {
    const log = logByUser.get(sub.user_id as string)
    const water = log?.water_cups ?? 0
    const steps = log?.steps ?? 0
    const sleep = log?.sleep_hours ?? 0

    const nudges: string[] = []
    if (water / 8 < 0.6) nudges.push(`💧 الماء: ${water}/8 أكواب`)
    if (steps / 8000 < 0.6) nudges.push(`👟 الخطوات: ${steps.toLocaleString()}/8,000`)
    if (sleep / 8 < 0.6) nudges.push(`😴 النوم: ${sleep}/8 ساعات`)

    if (nudges.length === 0) continue

    const msg = `مرحبا! 👋 تذكير سريع لصحتك اليوم:\n\n${nudges.join("\n")}\n\nلا تنسى اهتم بنفسك 💛`
    try {
      await sendWhatsAppMessage(sub.phone as string, msg)
      sent++
    } catch (err) {
      console.error("[health-nudges] send error:", sub.phone, err)
    }
  }

  return NextResponse.json({ sent })
}
