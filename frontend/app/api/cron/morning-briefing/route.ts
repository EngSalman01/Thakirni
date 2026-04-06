import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"
import { getRelevantMemory } from "@/lib/ai/memory"
import { detectPredictiveOpportunities, markInsightSent, wasInsightRecentlySent } from "@/lib/ai/predictor"
import { getExperimentVariant } from "@/lib/ai/ab-testing"

export const maxDuration = 60

interface GCalEvent {
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  location?: string
}

interface GCalResponse {
  items?: GCalEvent[]
}

interface Profile {
  id: string
  full_name: string | null
  phone_number: string
  preferred_language: string | null
  google_calendar_token: string | null
  google_calendar_refresh_token: string | null
  google_calendar_expires_at: string | null
  city: string | null
}

interface Plan {
  title: string
  plan_time: string | null
  location: string | null
  category: string
  plan_date: string
  status: string
}

interface ReminderRow {
  title: string
  remind_at: string
}

async function refreshGCalToken(
  supabase: ReturnType<typeof createServiceClient>,
  profile: Profile,
): Promise<string | null> {
  if (!profile.google_calendar_refresh_token) return null
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: profile.google_calendar_refresh_token,
        grant_type: "refresh_token",
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const newToken: string = data.access_token
    await supabase
      .from("profiles")
      .update({ google_calendar_token: newToken, google_calendar_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString() })
      .eq("id", profile.id)
    return newToken
  } catch { return null }
}

async function fetchGCalEvents(
  supabase: ReturnType<typeof createServiceClient>,
  profile: Profile,
  timeMin: string,
  timeMax: string,
): Promise<GCalEvent[]> {
  if (!profile.google_calendar_token) return []
  let token = profile.google_calendar_token
  if (profile.google_calendar_expires_at) {
    if (new Date(profile.google_calendar_expires_at).getTime() < Date.now()) {
      const refreshed = await refreshGCalToken(supabase, profile)
      if (!refreshed) return []
      token = refreshed
    }
  }
  try {
    const headers = { Authorization: `Bearer ${token}` }
    const calListRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=50", { headers })
    if (!calListRes.ok) return []
    const calList = await calListRes.json() as { items?: { id: string; selected?: boolean }[] }
    const calendars = (calList.items ?? []).filter(c => c.selected !== false)
    const qp = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "10" })
    const results = await Promise.allSettled(
      calendars.map(cal =>
        fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${qp}`, { headers })
          .then(r => r.ok ? r.json() : { items: [] })
          .then((d: GCalResponse) => d.items ?? [])
      )
    )
    return results.flatMap(r => r.status === "fulfilled" ? r.value : [])
  } catch { return [] }
}

function formatTime(timeStr: string, isArabic: boolean): string {
  const [h, m] = timeStr.split(":").map(Number)
  const ampm = h >= 12 ? (isArabic ? "م" : "PM") : (isArabic ? "ص" : "AM")
  const displayHour = h % 12 === 0 ? 12 : h % 12
  return `${displayHour}:${String(m).padStart(2, "0")} ${ampm}`
}

function formatGCalTime(dateTime: string, isArabic: boolean): string {
  const d = new Date(dateTime)
  return formatTime(`${d.getHours()}:${d.getMinutes()}`, isArabic)
}

/** Resolve smart city-aware traffic note */
function getTrafficNote(city: string | null, isArabic: boolean): string | null {
  const khobarCities = ["الخبر", "الدمام", "الظهران", "khobar", "dammam", "dhahran"]
  const riyadhCities = ["الرياض", "riyadh"]
  const jeddahCities = ["جدة", "jeddah"]

  const c = (city ?? "").toLowerCase()
  const isKhobar = khobarCities.some(k => c.includes(k))
  const isRiyadh = riyadhCities.some(k => c.includes(k))
  const isJeddah = jeddahCities.some(k => c.includes(k))

  if (isArabic) {
    if (isKhobar) return "الزحمة في الخبر صباحاً — اطلع بدري شوي 👀"
    if (isRiyadh) return "الدوار الشمالي وطريق الملك فهد فيهم ضغط — حسب الوقت 👀"
    if (isJeddah) return "الكورنيش وطريق الملك عبدالعزيز بيكون فيهم ضغط الصبح 👀"
  } else {
    if (isKhobar) return "Khobar morning traffic can be heavy — leave a bit early 👀"
    if (isRiyadh) return "Riyadh rush hour on King Fahad Rd — plan accordingly 👀"
    if (isJeddah) return "Jeddah morning traffic near Corniche — allow extra time 👀"
  }
  return null
}

/** Build monetization nudge if usage is at 80%+ */
async function getMonetizationNudge(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  isArabic: boolean,
  experimentVariant: "a" | "b" | "control"
): Promise<string | null> {
  const month = new Date().toISOString().slice(0, 7)
  const { data: usage } = await supabase
    .from("usage")
    .select("ai_chat_requests")
    .eq("user_id", userId)
    .eq("month", month)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .single()

  const tier = (profile?.plan_tier ?? "FREE").toUpperCase()
  const limits: Record<string, number> = { FREE: 30, PRO: 500, TEAMS: 2000 }
  const limit = limits[tier] ?? 30
  const current = (usage as { ai_chat_requests: number } | null)?.ai_chat_requests ?? 0
  const ratio = current / limit

  if (ratio < 0.80) return null

  const pct = Math.round(ratio * 100)

  // A/B test: soft vs direct upgrade message
  if (isArabic) {
    if (experimentVariant === "b") {
      // Direct variant
      return `⚡ استخدمت ${pct}% من رصيدك — ترقى الحين وخل مساعدك ما يوقف`
    }
    // Soft variant (default)
    return `قربت تخلص استخدامك الشهري (${pct}%) 👀 الترقية تفتح لك أضعاف ذلك`
  } else {
    if (experimentVariant === "b") {
      return `⚡ You've used ${pct}% of your quota — upgrade now and keep going`
    }
    return `You're at ${pct}% of your monthly limit 👀 Upgrade for way more room`
  }
}

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const supabase = createServiceClient()

  const now = new Date()
  const riyadhDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" })
  const timeMin = new Date(`${riyadhDate}T00:00:00+03:00`).toISOString()
  const timeMax = new Date(`${riyadhDate}T23:59:59+03:00`).toISOString()

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, preferred_language, google_calendar_token, google_calendar_refresh_token, google_calendar_expires_at, city")
    .not("phone_number", "is", null)

  if (profilesError) {
    console.error("[Cron/MorningBriefing] profiles fetch error:", profilesError.message)
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0 })
  }

  let sent = 0
  let skipped = 0

  for (const profile of profiles as Profile[]) {
    try {
      const isArabic = (profile.preferred_language ?? "ar") !== "en"
      const name = profile.full_name?.split(" ")[0] ?? (isArabic ? "صديقي" : "there")

      // A/B experiment variant for this user
      const upgradeVariant = await getExperimentVariant("exp_upgrade_message", profile.id)
      const briefingVariant = await getExperimentVariant("exp_morning_briefing", profile.id)

      // Fetch memory, plans, reminders, gcal in parallel
      const [memoryResult, plansResult, remindersResult, gcalEvents] = await Promise.all([
        getRelevantMemory(profile.id, null),
        supabase
          .from("plans")
          .select("title, plan_time, location, category, plan_date, status")
          .eq("user_id", profile.id)
          .eq("plan_date", riyadhDate)
          .eq("status", "pending")
          .order("plan_time", { ascending: true, nullsFirst: false }),
        supabase
          .from("reminders")
          .select("title, remind_at")
          .eq("user_id", profile.id)
          .eq("is_sent", false)
          .gte("remind_at", timeMin)
          .lte("remind_at", timeMax)
          .not("title", "like", "[FU:%")
          .order("remind_at", { ascending: true })
          .limit(5),
        fetchGCalEvents(supabase, profile, timeMin, timeMax),
      ])

      const todayPlans: Plan[] = plansResult.data ?? []
      const reminders: ReminderRow[] = remindersResult.data ?? []

      // Get usage ratio for predictor and monetization
      const month = new Date().toISOString().slice(0, 7)
      const { data: usageRow } = await supabase
        .from("usage")
        .select("ai_chat_requests")
        .eq("user_id", profile.id)
        .eq("month", month)
        .single()
      const aiUsed = (usageRow as { ai_chat_requests: number } | null)?.ai_chat_requests ?? 0

      const { data: profRow } = await supabase
        .from("profiles")
        .select("plan_tier")
        .eq("id", profile.id)
        .single()
      const tier = ((profRow as { plan_tier: string } | null)?.plan_tier ?? "FREE").toUpperCase()
      const limits: Record<string, number> = { FREE: 30, PRO: 500, TEAMS: 2000 }
      const limit = limits[tier] ?? 30
      const usageRatio = aiUsed / limit

      // Predictive insights (run in parallel with rest of build)
      const [insights, monetizationNudge] = await Promise.all([
        detectPredictiveOpportunities(profile.id, null, { usageRatio }),
        getMonetizationNudge(supabase, profile.id, isArabic, upgradeVariant),
      ])

      // ── Build message ────────────────────────────────────────────────────
      const timedPlans = todayPlans.filter(p => p.plan_time)
      const untimedPlans = todayPlans.filter(p => !p.plan_time)

      const isEmpty = timedPlans.length === 0 && untimedPlans.length === 0
        && gcalEvents.length === 0 && reminders.length === 0

      let message: string

      if (isEmpty) {
        if (isArabic) {
          message = `صباح النور ☀️ ${name} — جاهز نكسر اليوم؟ 👀\n\nيومك فاضي — تبغى أرتب لك شي؟`
        } else {
          message = `Good morning ${name} ☀️ Ready to crush today? 👀\n\nYou have nothing scheduled — want me to plan something?`
        }
      } else {
        const lines: string[] = []

        // Header — minimal vs detailed based on A/B experiment
        if (briefingVariant === "b") {
          lines.push(isArabic
            ? `صباح النور ☀️ ${name} — جاهز نكسر اليوم؟ 👀\n\nهذا يومك:`
            : `Good morning ${name} ☀️ Ready to crush today? 👀\n\nHere's your day:`)
        } else {
          lines.push(isArabic
            ? `صباح النور ☀️ ${name} — جاهز نكسر اليوم؟ 👀\n\nعندك اليوم:`
            : `Good morning ${name} ☀️ Ready to crush today? 👀\n\nToday:`)
        }

        // 📅 Timed events
        const allTimedEvents: string[] = [
          ...timedPlans.map(p => {
            const t = formatTime(p.plan_time!, isArabic)
            const loc = p.location ? ` - ${p.location}` : ""
            const icon = p.category === "meeting" ? "📅" : p.category === "health" ? "💪" : "✅"
            return `${icon} ${t} ${p.title}${loc}`
          }),
          ...gcalEvents
            .filter(e => e.start?.dateTime)
            .map(e => {
              const t = formatGCalTime(e.start!.dateTime!, isArabic)
              const loc = e.location ? ` - ${e.location}` : ""
              return `📅 ${t} ${e.summary ?? (isArabic ? "حدث" : "Event")}${loc}`
            }),
        ].sort()

        allTimedEvents.forEach(l => lines.push(l))

        // 📝 Tasks (untimed) — only in detailed variant or if few tasks
        const allTasks: string[] = [
          ...untimedPlans.map(p => `• ${p.title}`),
          ...gcalEvents
            .filter(e => !e.start?.dateTime && e.start?.date)
            .map(e => `• ${e.summary ?? (isArabic ? "حدث" : "Event")}`),
        ]

        if (allTasks.length > 0) {
          if (briefingVariant === "b") {
            lines.push(isArabic ? "\n📝 مهامك:" : "\n📝 Tasks:")
          }
          allTasks.forEach(t => lines.push(t))
        }

        // ⚠️ Reminders
        if (reminders.length > 0) {
          reminders.forEach(r => {
            const d = new Date(r.remind_at)
            const t = formatTime(`${d.getHours()}:${d.getMinutes()}`, isArabic)
            lines.push(`⏰ ${t} ${r.title}`)
          })
        }

        // Traffic note (city-aware)
        const trafficNote = getTrafficNote(profile.city, isArabic)
        if (trafficNote && allTimedEvents.length > 0) {
          lines.push(`\n${trafficNote}`)
        }

        // Predictive insight — show only the highest priority one not recently sent
        for (const insight of insights) {
          if (insight.type === "upgrade_prompt") continue // handled by monetization nudge
          const alreadySent = await wasInsightRecentlySent(profile.id, insight.type, 48)
          if (!alreadySent) {
            lines.push(`\n${isArabic ? insight.messageAr : insight.messageEn}`)
            await markInsightSent(profile.id, insight.type, insight.payload)
            break // max one insight per briefing
          }
        }

        message = lines.join("\n")
      }

      // Monetization nudge — append if applicable
      if (monetizationNudge) {
        message += `\n\n${monetizationNudge}`
      }

      // If memory tells us something special about today, inject it
      if (memoryResult.raw.length > 0) {
        const todayBirthday = memoryResult.raw.find(
          r => r.category === "important_dates" &&
               String(r.value.event ?? "").includes("birthday")
        )
        if (todayBirthday) {
          const label = String(todayBirthday.value.label ?? "")
          if (label) {
            const note = isArabic
              ? `\n\n🎂 اليوم عيد ميلاد ${label}! لا تنسى 😄`
              : `\n\n🎂 It's ${label}'s birthday today! Don't forget 😄`
            message += note
          }
        }
      }

      // Occasionally remind users about voice messages (once per week)
      const dayOfWeek = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Riyadh", weekday: "short" })
      if (dayOfWeek === "Mon") {
        message += isArabic
          ? "\n\n🎤 جرب ترسل فويس — ما تحتاج تكتب!"
          : "\n\n🎤 Try sending a voice message — no typing needed!"
      }

      await sendWhatsAppMessage(profile.phone_number, message)
      console.log(`[Cron/MorningBriefing] sent | user=${profile.id} variant=${briefingVariant}`)
      sent++

    } catch (err) {
      console.error(`[Cron/MorningBriefing] failed for user ${profile.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
