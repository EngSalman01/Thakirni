// app/api/cron/prayer-reminders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/cron-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

// Riyadh coordinates, Umm Al-Qura method (4)
const RIYADH_LAT = "24.6877"
const RIYADH_LON = "46.7219"
const PRAYER_METHOD = "4"

interface IslamicApiTiming {
  Fajr: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string;
}

interface IslamicApiResponse {
  code: number
  status: string
  data?: { times?: IslamicApiTiming }
}

const PRAYER_AR: Record<string, string> = {
  fajr: "الفجر", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء",
}
const PRAYER_EN: Record<string, string> = {
  fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha",
}
const PRAYER_KEY: Record<string, keyof IslamicApiTiming> = {
  fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha",
}

function getSaudiNow() {
  const now = new Date()
  const hhmm = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour12: false }).slice(0, 5)
  return { hhmm }
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number)
  const total = h * 60 + m + mins
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`
}

function isWithinWindow(prayerTime: string, nowHhmm: string, windowMinutes = 5): boolean {
  // Returns true if nowHhmm is within [prayerTime - windowMinutes, prayerTime]
  const start = addMinutes(prayerTime, -windowMinutes)
  return nowHhmm >= start && nowHhmm < prayerTime
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const supabase = createServiceClient()
  const { hhmm } = getSaudiNow()

  // Fetch today's prayer times for Riyadh from islamicapi.com
  const apiKey = process.env.ISLAMIC_API_KEY
  if (!apiKey) {
    console.error("[prayer-reminders] ISLAMIC_API_KEY not set")
    return NextResponse.json({ error: "missing_api_key" }, { status: 500 })
  }

  let timings: IslamicApiTiming | null = null
  try {
    const url = `https://islamicapi.com/api/v1/prayer-time/?lat=${RIYADH_LAT}&lon=${RIYADH_LON}&method=${PRAYER_METHOD}&api_key=${apiKey}`
    const res = await fetch(url, { cache: "no-store" })
    const json = await res.json() as IslamicApiResponse
    timings = json.data?.times ?? null
  } catch (err) {
    console.error("[prayer-reminders] islamicapi fetch error:", err)
    return NextResponse.json({ error: "islamicapi_fetch_failed" }, { status: 500 })
  }

  if (!timings) {
    return NextResponse.json({ error: "no_timings" }, { status: 500 })
  }

  // Find which prayers fire in this 15-min window
  const firingPrayers: string[] = []
  for (const key of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
    const prayerHhmm = timings[PRAYER_KEY[key]].slice(0, 5)
    if (isWithinWindow(prayerHhmm, hhmm, 5)) {
      firingPrayers.push(key)
    }
  }

  if (firingPrayers.length === 0) {
    return NextResponse.json({ sent: 0, prayers: [] })
  }

  // Fetch all enabled subscribers for these prayers
  const { data: subs } = await supabase
    .from("prayer_subscriptions")
    .select("phone, prayers")
    .eq("enabled", true)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, prayers: firingPrayers })
  }

  let sent = 0
  for (const sub of subs) {
    const subPrayers = sub.prayers as string[]
    for (const prayer of firingPrayers) {
      if (!subPrayers.includes(prayer)) continue
      const arName = PRAYER_AR[prayer]
      const enName = PRAYER_EN[prayer]
      const msg = `🕌 حان وقت صلاة ${arName}\nتقبل الله صلاتك 🤲\n\nPrayer time: ${enName}\nMay Allah accept your prayer.`
      try {
        await sendWhatsAppMessage(sub.phone as string, msg)
        sent++
      } catch (err) {
        console.error("[prayer-reminders] send error:", sub.phone, err)
      }
    }
  }

  return NextResponse.json({ sent, prayers: firingPrayers })
}
