// app/api/cron/prayer-reminders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireCronSecret } from "@/lib/cron-auth"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

// Major Saudi cities with coordinates — method 4 (Umm Al-Qura, Makkah)
const CITY_COORDS: Record<string, { lat: string; lon: string }> = {
  riyadh:    { lat: "24.6877", lon: "46.7219" },
  dammam:    { lat: "26.4207", lon: "50.0888" },
  khobar:    { lat: "26.2172", lon: "50.1971" },
  "al khobar": { lat: "26.2172", lon: "50.1971" },
  jeddah:    { lat: "21.5433", lon: "39.1728" },
  mecca:     { lat: "21.3891", lon: "39.8579" },
  makkah:    { lat: "21.3891", lon: "39.8579" },
  medina:    { lat: "24.5247", lon: "39.5692" },
  madinah:   { lat: "24.5247", lon: "39.5692" },
  taif:      { lat: "21.2854", lon: "40.4152" },
  abha:      { lat: "18.2164", lon: "42.5053" },
  tabuk:     { lat: "28.3835", lon: "36.5662" },
  buraidah:  { lat: "26.3260", lon: "43.9750" },
  hail:      { lat: "27.5114", lon: "41.7208" },
  najran:    { lat: "17.4924", lon: "44.1277" },
  jizan:     { lat: "16.8892", lon: "42.5611" },
  jazan:     { lat: "16.8892", lon: "42.5611" },
  ahsa:      { lat: "25.3816", lon: "49.5862" },
  "al ahsa": { lat: "25.3816", lon: "49.5862" },
  hofuf:     { lat: "25.3816", lon: "49.5862" },
  jubail:    { lat: "27.0050", lon: "49.6585" },
  yanbu:     { lat: "24.0894", lon: "38.0618" },
  khamis:    { lat: "18.3059", lon: "42.7291" },
  "khamis mushait": { lat: "18.3059", lon: "42.7291" },
  baha:      { lat: "20.0125", lon: "41.4645" },
  "al baha": { lat: "20.0125", lon: "41.4645" },
  arar:      { lat: "30.9753", lon: "41.0381" },
  sakaka:    { lat: "29.9697", lon: "40.2064" },
  hafr:      { lat: "28.4329", lon: "48.4697" },
  "hafr al batin": { lat: "28.4329", lon: "48.4697" },
}

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

function getSaudiNow(): string {
  return new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Riyadh", hour12: false }).slice(0, 5)
}

function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(":").map(Number)
  const total = h * 60 + m + mins
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`
}

function firingPrayersForTimings(timings: IslamicApiTiming, nowHhmm: string): string[] {
  const firing: string[] = []
  for (const key of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
    const prayerHhmm = timings[PRAYER_KEY[key]].slice(0, 5)
    const start = addMinutes(prayerHhmm, -5)
    if (nowHhmm >= start && nowHhmm < prayerHhmm) {
      firing.push(key)
    }
  }
  return firing
}

async function fetchTimings(lat: string, lon: string, apiKey: string): Promise<IslamicApiTiming | null> {
  const url = `https://islamicapi.com/api/v1/prayer-time/?lat=${lat}&lon=${lon}&method=${PRAYER_METHOD}&api_key=${apiKey}`
  const res = await fetch(url, { cache: "no-store" })
  const json = await res.json() as IslamicApiResponse
  return json.data?.times ?? null
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const apiKey = process.env.ISLAMIC_API_KEY
  if (!apiKey) {
    console.error("[prayer-reminders] ISLAMIC_API_KEY not set")
    return NextResponse.json({ error: "missing_api_key" }, { status: 500 })
  }

  const supabase = createServiceClient()
  const nowHhmm = getSaudiNow()

  // Fetch all enabled subscribers with their city
  const { data: subs } = await supabase
    .from("prayer_subscriptions")
    .select("phone, prayers, city")
    .eq("enabled", true)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Group subscribers by normalised city key
  const byCity = new Map<string, typeof subs>()
  for (const sub of subs) {
    const cityKey = (sub.city as string).toLowerCase().trim()
    if (!byCity.has(cityKey)) byCity.set(cityKey, [])
    byCity.get(cityKey)!.push(sub)
  }

  // Fetch prayer times per unique city and send
  let totalSent = 0
  const results: Record<string, number> = {}

  for (const [cityKey, citySubs] of byCity) {
    const coords = CITY_COORDS[cityKey] ?? CITY_COORDS.riyadh // fallback to Riyadh
    let timings: IslamicApiTiming | null = null
    try {
      timings = await fetchTimings(coords.lat, coords.lon, apiKey)
    } catch (err) {
      console.error(`[prayer-reminders] fetch error for ${cityKey}:`, err)
      continue
    }

    if (!timings) continue

    const firing = firingPrayersForTimings(timings, nowHhmm)
    if (firing.length === 0) continue

    for (const sub of citySubs) {
      const subPrayers = sub.prayers as string[]
      for (const prayer of firing) {
        if (!subPrayers.includes(prayer)) continue
        const arName = PRAYER_AR[prayer]
        const enName = PRAYER_EN[prayer]
        const msg = `🕌 حان وقت صلاة ${arName}\nتقبل الله صلاتك 🤲\n\nPrayer time: ${enName}\nMay Allah accept your prayer.`
        try {
          await sendWhatsAppMessage(sub.phone as string, msg)
          totalSent++
        } catch (err) {
          console.error("[prayer-reminders] send error:", sub.phone, err)
        }
      }
    }

    results[cityKey] = firing.length
  }

  return NextResponse.json({ sent: totalSent, cities: Object.keys(results), now: nowHhmm })
}
