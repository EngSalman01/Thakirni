import { streamText, tool, convertToCoreMessages } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getHijriDate, formatTodayBlock, formatFactsBlock } from "@/server/services/ai.service"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"
import { trackEvent } from "@/lib/analytics"

export const maxDuration = 60

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

// ─── Google Calendar in-memory cache (5 min TTL) ──────────────────────────────
const gcalCache = new Map<string, { block: string; expiresAt: number }>()
function getCachedGcal(userId: string): string | null {
  const entry = gcalCache.get(userId)
  if (!entry || Date.now() > entry.expiresAt) { gcalCache.delete(userId); return null }
  return entry.block
}
function setCachedGcal(userId: string, block: string) {
  gcalCache.set(userId, { block, expiresAt: Date.now() + 5 * 60 * 1000 })
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

function getSaudiTime() {
  const now = new Date()
  const tz = "Asia/Riyadh"

  const currentDate = now.toLocaleDateString("en-CA", { timeZone: tz })
  const currentTime = now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }).slice(0, 5)
  const currentDayName = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long" })
  const currentHour = parseInt(now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }).slice(0, 2))

  const addDays = (d: number) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + d)
    return dt.toLocaleDateString("en-CA", { timeZone: tz })
  }

  // Pre-resolve all day names for the next 7 days so the model never has to guess
  const dayNameToDate: Record<string, string> = {}
  for (let i = 0; i <= 7; i++) {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + i)
    const dayName = dt.toLocaleDateString("en-US", { timeZone: tz, weekday: "long" }).toLowerCase()
    const dateStr = dt.toLocaleDateString("en-CA", { timeZone: tz })
    if (!dayNameToDate[dayName]) dayNameToDate[dayName] = dateStr
  }

  const timeOfDay: "morning" | "afternoon" | "evening" | "night" =
    currentHour < 12 ? "morning" :
      currentHour < 17 ? "afternoon" :
        currentHour < 21 ? "evening" : "night"

  return { now, currentDate, currentTime, currentDayName, currentHour, timeOfDay, addDays, dayNameToDate }
}

// ─── Language detection ───────────────────────────────────────────────────────

function detectLanguage(messages: unknown[]): "ar" | "en" {
  const userMsgs = (messages as Array<{ role: string; content: unknown }>)
    .filter(m => m.role === "user")
    .slice(-3)
  for (const msg of userMsgs.reverse()) {
    const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
    if (/[؀-ۿ]/.test(text)) return "ar"
  }
  return "en"
}

// ─── Intent classifier ────────────────────────────────────────────────────────

function classifyIntent(messages: unknown[]): "task" | "chat" | "question" | "correction" {
  const last = (messages as Array<{ role: string; content: unknown }>)
    .filter(m => m.role === "user")
    .slice(-1)[0]
  if (!last) return "chat"

  const text = (typeof last.content === "string"
    ? last.content
    : JSON.stringify(last.content)
  ).toLowerCase()

  if (/no[,\s]|wrong|mistake|not right|that'?s not|incorrect|لا |مو صح|غلط|مو كذا/.test(text))
    return "correction"
  if (/remind|schedule|add|create|cancel|delete|move|update|meeting|task|appointment|اضف|ذكرني|حدد|اجتماع|موعد|احذف|عدّل/.test(text))
    return "task"
  if (/what|how|why|who|when|where|explain|tell me|define|هو ايش|ايش|كيف|ليش|وين|متى|وش|عندي|عندك/.test(text))
    return "question"

  return "chat"
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const supabase = await createClient()
    const serviceSupabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Rate limit: 20 chat messages per minute per user (or per IP for guests)
    const rateLimitKey = user?.id ?? (req.headers.get("x-forwarded-for") ?? "anon")
    const rl = await limiters.chat(rateLimitKey)
    if (!rl.success) return rateLimitResponse(rl.reset)

    const {
      currentDate,
      currentTime,
      currentDayName,
      timeOfDay,
      addDays,
      dayNameToDate,
    } = getSaudiTime()

    const dayMap = {
      today: currentDate,
      tomorrow: addDays(1),
      yesterday: addDays(-1),
      "day after tomorrow": addDays(2),
      "next week": addDays(7),
    }

    // Human-readable day lookup block for the system prompt
    const dayLookupBlock = Object.entries(dayNameToDate)
      .map(([day, date]) => `  ${day.charAt(0).toUpperCase() + day.slice(1)} → ${date}`)
      .join("\n")

    const detectedLang = detectLanguage(messages)
    const intent = classifyIntent(messages)

    const langInstruction = detectedLang === "ar"
      ? "⚠️ إلزامي: المستخدم يكتب بالعربي. ردّ بالعربي فقط — باللهجة السعودية الخليجية. لا فصحى، لا إنجليزي."
      : "⚠️ MANDATORY: User is writing in English. Reply in English only. Never switch to Arabic."

    // ── Load user context in parallel ─────────────────────────────────────────
    let factsBlock = ""
    let todayBlock = ""
    let profileName = ""
    let googleCalendarBlock = ""
    let habitsBlock = ""
    let goalsBlock = ""

    if (user) {
      const [factsRes, plansRes, profileRes, habitsRes, goalsRes] = await Promise.all([
        serviceSupabase
          .from("user_facts")
          .select("fact, category")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(40),

        supabase
          .from("plans")
          .select("title, plan_time, end_time, category, location, priority, status")
          .eq("user_id", user.id)
          .eq("plan_date", currentDate)
          .eq("status", "pending")
          .order("plan_time", { ascending: true, nullsFirst: false })
          .limit(20),

        supabase
          .from("profiles")
          .select("full_name, preferred_language, google_calendar_token, google_calendar_refresh_token, google_calendar_expires_at")
          .eq("id", user.id)
          .single(),

        // Active habits with today's completion status
        supabase
          .from("habits")
          .select("name, icon, frequency, current_streak, longest_streak, habit_logs(log_date)")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(10),

        // Active goals with progress
        supabase
          .from("goals")
          .select("title, category, progress, target_date, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      profileName = profileRes.data?.full_name ?? ""
      factsBlock = formatFactsBlock(factsRes.data ?? [])
      todayBlock = formatTodayBlock(plansRes.data ?? [], currentDate)

      // ── Habits block ────────────────────────────────────────────────────────
      if (habitsRes.data && habitsRes.data.length > 0) {
        const lines = habitsRes.data.map((h) => {
          const logs = (h.habit_logs as { log_date: string }[] | null) ?? []
          const doneToday = logs.some((l) => l.log_date === currentDate)
          return `  ${doneToday ? "✅" : "⬜"} ${h.icon} ${h.name} (streak: ${h.current_streak}d)`
        })
        habitsBlock = `HABITS TODAY:\n${lines.join("\n")}`
      }

      // ── Goals block ─────────────────────────────────────────────────────────
      if (goalsRes.data && goalsRes.data.length > 0) {
        const lines = goalsRes.data.map((g) => {
          const due = g.target_date ? ` — due ${g.target_date}` : ""
          return `  • ${g.title} [${g.category}] ${g.progress}%${due}`
        })
        goalsBlock = `ACTIVE GOALS:\n${lines.join("\n")}`
      }

      // ── Fetch Google Calendar events if connected (with 5-min cache) ───────────
      let gcalToken = profileRes.data?.google_calendar_token ?? null
      if (gcalToken) {
        const cached = getCachedGcal(user.id)
        if (cached !== null) {
          googleCalendarBlock = cached
        } else {
          // Refresh token if expired
          const expiresAt = profileRes.data?.google_calendar_expires_at
          if (expiresAt && Date.now() > new Date(expiresAt).getTime() - 60_000) {
            const refreshToken = profileRes.data?.google_calendar_refresh_token
            if (refreshToken) {
              try {
                const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: new URLSearchParams({ refresh_token: refreshToken, client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", grant_type: "refresh_token" }),
                })
                if (refreshRes.ok) {
                  const refreshData = await refreshRes.json() as { access_token: string; expires_in: number }
                  gcalToken = refreshData.access_token
                  supabase.from("profiles").update({ google_calendar_token: gcalToken, google_calendar_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString() }).eq("id", user.id).then(undefined, () => {})
                }
              } catch { /* silent */ }
            }
          }

          try {
            const nowIso = new Date().toISOString()
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            const params = new URLSearchParams({ timeMin: nowIso, timeMax: nextWeek, maxResults: "15", singleEvents: "true", orderBy: "startTime" })
            const gcalRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
              headers: { Authorization: `Bearer ${gcalToken}` },
            })
            if (gcalRes.ok) {
              const gcalData = await gcalRes.json() as { items?: Array<{ summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; location?: string }> }
              const events = gcalData.items ?? []
              if (events.length > 0) {
                const lines = events.map(ev => {
                  const start = ev.start?.dateTime ?? ev.start?.date ?? ""
                  const end = ev.end?.dateTime ?? ev.end?.date ?? ""
                  const startStr = start ? new Date(start).toLocaleString("en-GB", { timeZone: "Asia/Riyadh", dateStyle: "short", timeStyle: "short" }) : "All day"
                  const endStr = ev.start?.dateTime && end ? new Date(end).toLocaleString("en-GB", { timeZone: "Asia/Riyadh", timeStyle: "short" }) : ""
                  const loc = ev.location ? ` @ ${ev.location}` : ""
                  return `  • ${ev.summary ?? "Untitled"} — ${startStr}${endStr ? ` → ${endStr}` : ""}${loc}`
                })
                googleCalendarBlock = `GOOGLE CALENDAR (next 7 days):\n${lines.join("\n")}`
              } else {
                googleCalendarBlock = "GOOGLE CALENDAR: No upcoming events in the next 7 days."
              }
              setCachedGcal(user.id, googleCalendarBlock)
            }
          } catch { /* silent */ }
        }
      }
    }

    const hijriDate = getHijriDate()

    // ── Persist user message (fire-and-forget) ────────────────────────────────
    const lastUserMessage = messages[messages.length - 1]
    if (user && lastUserMessage?.role === "user") {
      serviceSupabase
        .from("conversations")
        .insert({
          user_id: user.id,
          role: "user",
          content: typeof lastUserMessage.content === "string"
            ? lastUserMessage.content
            : JSON.stringify(lastUserMessage.content),
        })
        .then(undefined, (err: unknown) =>
          console.error("[Thakirni] Failed to save user message:", err))
    }

    // ── Google Calendar token helper ──────────────────────────────────────────
    const getGcalToken = async (): Promise<string | null> => {
      if (!user) return null
      const { data: prof } = await supabase
        .from("profiles")
        .select("google_calendar_token, google_calendar_refresh_token, google_calendar_expires_at")
        .eq("id", user.id)
        .single()
      if (!prof?.google_calendar_token) return null
      let token = prof.google_calendar_token
      if (prof.google_calendar_expires_at && Date.now() > new Date(prof.google_calendar_expires_at).getTime() - 60_000 && prof.google_calendar_refresh_token) {
        try {
          const rr = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ refresh_token: prof.google_calendar_refresh_token, client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", grant_type: "refresh_token" }),
          })
          if (rr.ok) {
            const rd = await rr.json() as { access_token: string; expires_in: number }
            token = rd.access_token
            supabase.from("profiles").update({ google_calendar_token: token, google_calendar_expires_at: new Date(Date.now() + rd.expires_in * 1000).toISOString() }).eq("id", user.id).then(undefined, () => {})
          }
        } catch { /* silent */ }
      }
      return token
    }

    // Build a Google Calendar event body from plan fields
    const buildGcalEvent = (fields: { title?: string; description?: string; location?: string; plan_date?: string; plan_time?: string; end_time?: string; is_all_day?: boolean }) => {
      const ev: Record<string, unknown> = {}
      if (fields.title) ev.summary = fields.title
      if (fields.description) ev.description = fields.description
      if (fields.location) ev.location = fields.location
      if (fields.plan_date) {
        if (fields.is_all_day || !fields.plan_time) {
          ev.start = { date: fields.plan_date }
          ev.end = { date: fields.plan_date }
        } else {
          ev.start = { dateTime: `${fields.plan_date}T${fields.plan_time}:00`, timeZone: "Asia/Riyadh" }
          ev.end = { dateTime: `${fields.plan_date}T${fields.end_time ?? fields.plan_time}:00`, timeZone: "Asia/Riyadh" }
        }
      }
      return ev
    }

    // ── Stream ────────────────────────────────────────────────────────────────
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      maxSteps: 15,
      messages: convertToCoreMessages(messages),

      onFinish: async ({ text }) => {
        if (!user || !text) return
        try {
          await serviceSupabase.from("conversations").insert({
            user_id: user.id,
            role: "assistant",
            content: text,
          })
        } catch (err) {
          console.error("[Thakirni] Failed to save assistant message:", err)
        }
      },

      system: `
${langInstruction}
Current detected intent: ${intent}

You are Thakirni (ذكرني).
${profileName ? `The user's name is ${profileName}.` : ""}

━━━━━━━━━━━━━━━━━━━━
🕒 Riyadh — ${currentDate} (${currentDayName}) · ${currentTime} · ${timeOfDay}
Hijri: ${hijriDate}
━━━━━━━━━━━━━━━━━━━━
${todayBlock}
━━━━━━━━━━━━━━━━━━━━
${googleCalendarBlock ? `${googleCalendarBlock}\n━━━━━━━━━━━━━━━━━━━━` : ""}
${habitsBlock ? `${habitsBlock}\n━━━━━━━━━━━━━━━━━━━━` : ""}
${goalsBlock ? `${goalsBlock}\n━━━━━━━━━━━━━━━━━━━━` : ""}
${factsBlock}
━━━━━━━━━━━━━━━━━━━━

DAY → DATE LOOKUP (always use this to resolve day names before any tool call):
${dayLookupBlock}
  Next week  → ${dayMap["next week"]}
  Yesterday  → ${dayMap["yesterday"]}


════════════════════════════════════
WHO YOU ARE
════════════════════════════════════

You are the user's closest, most trusted friend — someone who is incredibly smart,
deeply organised, remembers everything, and genuinely cares about them.
You are NOT a corporate assistant. You are NOT a command executor.
You are a real PERSON the user can talk to about literally anything.

You have TWO modes that you switch between naturally:

MODE 1 — CONVERSATION (for: chat, questions, venting, ideas, general knowledge)
  • Answer questions like a brilliant, curious friend
  • Give real opinions. Be honest. Be a bit funny when the moment calls for it.
  • Do NOT force tasks or tools into every message
  • Do NOT ask "should I add that to your calendar?" after every sentence
  • Match their energy — relaxed message → relaxed reply, urgent → focused

MODE 2 — ASSISTANT (for: when the user clearly wants an action done)
  • Triggered by: "add", "schedule", "remind me", "what's on my calendar", "delete", "move"
  • Collect all required info → confirm → use the right tool


════════════════════════════════════
LANGUAGE & TONE
════════════════════════════════════

Arabic — Saudi/Gulf colloquial ONLY:
  ✅ "هلا!" / "وش صاير؟" / "زين" / "عال" / "ماشي" / "خلني أشوف" / "صح" / "تمام" / "أيه والله"
  ❌ NEVER: "بالتأكيد" / "حسناً" / "كيف يمكنني مساعدتك؟" / "يُرجى" / "لقد قمت بـ"

English — warm, casual, zero corporate speak:
  ✅ "yeah!" / "totally" / "makes sense" / "ooh good point" / "honestly..." / "hmm let me think"
  ❌ NEVER: "Certainly!" / "Of course!" / "I'd be happy to assist!" / "As an AI language model"

Keep replies SHORT. Think WhatsApp, not email.
Use emojis only when they genuinely fit — not to pad every message.


════════════════════════════════════
HANDLING MISTAKES & CORRECTIONS
════════════════════════════════════

When the user corrects you:
  1. Acknowledge honestly — "you're right, my bad" / "صح، غلطت"
  2. Fix it immediately — no over-apologising
  3. If the correction reveals an updated fact → call store_fact silently

When YOU are unsure:
  • Say so honestly: "honestly not 100% sure" / "مو واثق ١٠٠٪ — بس أعتقد..."
  • Never make up facts. Honest uncertainty > confident nonsense.
  • No live internet → tell them if they ask about breaking news

When a tool fails internally:
  • Show the user a calm message only: "شي ما اشتغل، تبي تحاول مرة ثانية؟" / "something went wrong, try again?"
  • Never show raw errors or JSON to the user


════════════════════════════════════
LEARNING ABOUT THE USER (Your superpower)
════════════════════════════════════

Extract and silently store facts whenever the user reveals:
  → Job, team, manager, company, projects
  → Family, relationships, names of people they mention
  → Goals, habits, hobbies, preferences
  → Health, location, financial habits
  → Anything personal that comes up naturally

Rules for store_fact:
  • COMPLETELY SILENT — never say "I've noted that" or "I'll remember that"
  • Check WHAT I KNOW above before storing — avoid exact duplicates
  • If the user corrects a fact → store the corrected version
  • One fact per call, plain language: "Manager's name is Khalid at Saudi Aramco"

USE what you know naturally:
  • "أذكر إنك ذكرت..." / "wait, didn't you say you work at..."
  • Connect dots: "هذا ثاني اجتماع مع الفريق هالأسبوع، شكلك مشغول 😄"
  • Only bring it up when genuinely relevant


════════════════════════════════════
DAILY BRIEFING (on greeting)
════════════════════════════════════

When the user greets you with no specific task:
  • Use TODAY'S SCHEDULE already loaded above — do NOT call list_plans
  • Short and warm. Mention count + most important item.
  • Arabic: "هلا! عندك اليوم ٢ مواعيد — أهمها اجتماع الساعة ٣. كيف حالك؟"
  • English: "hey! you've got 2 things today — main one's your 3pm meeting. how's it going?"
  • Nothing scheduled: "ما عندك شي اليوم 😄" / "clear day today, nice"


════════════════════════════════════
TASK / PLANNING RULES
════════════════════════════════════

🚨 ABSOLUTE RULE: You are NOT allowed to call create_plan for a MEETING
until you have ALL FOUR of these confirmed by the user in conversation:
  1. Title    ✅
  2. Date     ✅ (resolve from day name using DAY → DATE LOOKUP above)
  3. Time     ← MUST ASK IF MISSING — never assume or default
  4. Location ← MUST ASK IF MISSING — never assume or default

If ANY of the four are missing → ask for the first missing one → STOP. No tool calls yet.
Ask ONE question at a time. Never ask time and location in the same message.

EXACT EXAMPLE:
  User: "Add team meeting on Sunday"
  ❌ WRONG: [calls create_plan — time and location are missing]
  ✅ RIGHT: "sure! what time is the meeting?"
  User: "3pm"
  ✅ RIGHT: "got it — and where? office, online, or somewhere else?"
  User: "office"
  ✅ RIGHT: "team meeting Sunday at 3pm at the office — add it?"
  User: "yes"
  ✅ RIGHT: [NOW call create_plan]

For TASKS (not meetings): title is enough — date defaults to today.
For GROCERY: just need the items list.

After collecting everything: confirm naturally → wait for yes → THEN call the tool.
After a write action: confirm in plain language. Do NOT call list_plans to verify.

CONFLICT DETECTION — before calling create_plan for a timed meeting:
  • Check TODAY'S SCHEDULE and GOOGLE CALENDAR above for overlapping times
  • If conflict found → warn the user BEFORE confirming: "heads up, you already have [X] at that time — still want to add it?"
  • Let the user decide — don't block them

REMINDER PREFERENCES:
  • Default auto-reminder: 30 minutes before any timed plan
  • If user says "remind me 1 hour before" or "remind me the day before" → call set_reminder with their preferred time instead of the default
  • If user says "no reminder" → skip the auto-reminder (just note it)

HABITS & GOALS AWARENESS:
  • HABITS TODAY section shows which habits are done (✅) or pending (⬜) today
  • ACTIVE GOALS section shows current goals and progress
  • When relevant, connect plans to goals: "this fits your [goal] goal!"
  • Encourage habit completion naturally: if it's evening and habits are pending, mention it warmly

Date resolution (always use DAY → DATE LOOKUP above):
  "at 5" afternoon/evening → 17:00 | morning → 05:00
  No end time → start + 1 hour
  "next week" → ${dayMap["next week"]}
  "this weekend" → ${addDays(6 - new Date(currentDate).getDay())}


════════════════════════════════════
TOOL REFERENCE
════════════════════════════════════
create_plan     → schedule events, tasks, meetings, shopping lists
update_plan     → modify an existing plan (list_plans first for the ID)
delete_plan     → remove a plan (list_plans first for the ID)
mark_done       → mark a task/plan complete
list_plans      → retrieve schedule — use date_filter='specific' + specific_date for named days
search_plans    → search plans by keyword
save_memory     → save note/fact/idea to Second Brain
search_memories → search Second Brain
store_fact      → SILENTLY learn a personal fact about the user
get_my_facts    → show user what you know about them
get_timeline    → life timeline (days_back: 7=week, 30=month)
set_reminder    → schedule a WhatsApp or push notification

NOTE: If the user has Google Calendar connected, their upcoming events are already shown above in GOOGLE CALENDAR section. Reference them naturally when relevant (e.g. briefings, scheduling conflicts).
NOTE: Habits and goals are already loaded above — use them naturally without calling any tool for them.
`,

      tools: {

        // ── CREATE PLAN ────────────────────────────────────────────────────────
        create_plan: tool({
          description:
            "Create a calendar event, meeting, task, or shopping list. " +
            "MEETINGS: only call after collecting title + date + time + location AND user confirmed. " +
            "TASKS: title is enough, date defaults to today. " +
            "GROCERY: just need the items list.",
          parameters: z.object({
            title: z.string().describe("Short, clear title"),
            description: z.string().optional().describe("Details, agenda, or notes"),
            plan_date: z.string().describe(`Date YYYY-MM-DD. Today = ${currentDate}. Always resolve day names using the DAY → DATE LOOKUP first.`),
            plan_time: z.string().optional().describe("Start time HH:MM. Required for meetings — must be collected from user, never assumed."),
            end_time: z.string().optional().describe("End time HH:MM. Default: start + 1 hour."),
            is_all_day: z.boolean().optional().describe("True for birthdays, holidays, all-day events."),
            location: z.string().optional().describe("Address, 'Online', or 'TBD'. Required for meetings — must be collected from user."),
            attendees: z.array(z.string()).optional().describe("Names or emails"),
            category: z.enum(["task", "meeting", "grocery", "work", "personal", "health", "finance", "other"])
              .describe("Auto-detect from context"),
            priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
            recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional().default("none"),
          }),
          execute: async (input) => {
            if (!user) return { success: false, message: "Login required" }

            let endTime = input.end_time
            if (input.plan_time && !endTime) {
              const [h, m] = input.plan_time.split(":").map(Number)
              endTime = `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
            }

            const { data, error } = await supabase
              .from("plans")
              .insert({
                user_id: user.id,
                title: input.title,
                description: input.description ?? null,
                plan_date: input.plan_date,
                plan_time: input.plan_time ?? null,
                end_time: endTime ?? null,
                location: input.location ?? null,
                attendees: input.attendees ?? [],
                category: input.category,
                priority: input.priority ?? "medium",
                recurrence: input.recurrence ?? "none",
                is_all_day: input.is_all_day ?? false,
                status: "pending",
              })
              .select()
              .single()

            if (error) return { success: false, message: error.message }

            // Auto-log to timeline (fire-and-forget)
            serviceSupabase.from("timeline_events").insert({
              user_id: user.id,
              title: `Scheduled: ${input.title}`,
              event_date: input.plan_date,
              source_type: "plan_created",
              source_id: data.id,
              importance: input.priority === "high" ? 3 : input.priority === "medium" ? 2 : 1,
            }).then(undefined, () => { })

            // Sync to Google Calendar
            try {
              const gcalToken = await getGcalToken()
              if (gcalToken) {
                const gcalRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${gcalToken}`, "Content-Type": "application/json" },
                  body: JSON.stringify(buildGcalEvent({ title: input.title, description: input.description, location: input.location, plan_date: input.plan_date, plan_time: input.plan_time, end_time: endTime ?? undefined, is_all_day: input.is_all_day })),
                })
                if (gcalRes.ok) {
                  const gcalData = await gcalRes.json() as { id: string }
                  supabase.from("plans").update({ gcal_event_id: gcalData.id }).eq("id", data.id).then(undefined, () => {})
                }
              }
            } catch { /* silent */ }

            // Auto-schedule WhatsApp reminder 30 min before (only for timed events in the future)
            if (input.plan_time && !input.is_all_day) {
              try {
                const eventMs = new Date(`${input.plan_date}T${input.plan_time}:00`).getTime() - 5 * 60 * 60 * 1000 // convert Riyadh (+3) to UTC
                const remindMs = eventMs - 30 * 60 * 1000
                if (remindMs > Date.now()) {
                  const { data: prof } = await supabase.from("profiles").select("phone_number").eq("id", user.id).single()
                  const channel = prof?.phone_number ? "whatsapp" : "push"
                  supabase.from("reminders").insert({
                    user_id: user.id,
                    title: input.title,
                    remind_at: new Date(remindMs).toISOString(),
                    plan_id: data.id,
                    channel,
                    is_sent: false,
                  }).then(undefined, () => {})
                }
              } catch { /* silent */ }
            }

            return {
              success: true,
              message: `Scheduled "${input.title}" on ${input.plan_date}${input.plan_time ? " at " + input.plan_time.slice(0, 5) : ""}.`,
              plan: data,
            }
          },
        }),

        // ── UPDATE PLAN ────────────────────────────────────────────────────────
        update_plan: tool({
          description: "Update fields on an existing plan. Use list_plans first to get the plan_id.",
          parameters: z.object({
            plan_id: z.string().describe("UUID of the plan"),
            title: z.string().optional(),
            description: z.string().optional(),
            plan_date: z.string().optional().describe("YYYY-MM-DD — resolve day names first"),
            plan_time: z.string().optional().describe("HH:MM"),
            end_time: z.string().optional().describe("HH:MM"),
            location: z.string().optional(),
            attendees: z.array(z.string()).optional(),
            priority: z.enum(["low", "medium", "high"]).optional(),
            recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
            status: z.enum(["pending", "done", "cancelled"]).optional(),
          }),
          execute: async (input) => {
            if (!user) return { success: false, message: "Login required" }
            const { plan_id, ...fields } = input
            // Fetch existing plan first (need gcal_event_id + current values for gcal patch)
            const { data: existing } = await supabase.from("plans").select("*").eq("id", plan_id).eq("user_id", user.id).single()
            const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
            const { data, error } = await supabase.from("plans").update(updates).eq("id", plan_id).eq("user_id", user.id).select().single()
            if (error) return { success: false, message: error.message }

            // Sync update to Google Calendar
            if (existing?.gcal_event_id) {
              try {
                const gcalToken = await getGcalToken()
                if (gcalToken) {
                  const merged = { ...existing, ...updates }
                  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.gcal_event_id}`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${gcalToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify(buildGcalEvent({ title: merged.title, description: merged.description, location: merged.location, plan_date: merged.plan_date, plan_time: merged.plan_time, end_time: merged.end_time, is_all_day: merged.is_all_day })),
                  })
                }
              } catch { /* silent */ }
            }

            return { success: true, message: "Plan updated.", plan: data }
          },
        }),

        // ── DELETE PLAN ────────────────────────────────────────────────────────
        delete_plan: tool({
          description: "Delete a plan permanently. Use list_plans first to get the plan_id.",
          parameters: z.object({
            plan_id: z.string().describe("UUID of the plan to delete"),
          }),
          execute: async ({ plan_id }) => {
            if (!user) return { success: false, message: "Login required" }
            // Fetch gcal_event_id before deleting
            const { data: existing } = await supabase.from("plans").select("gcal_event_id").eq("id", plan_id).eq("user_id", user.id).single()
            const { error } = await supabase.from("plans").delete().eq("id", plan_id).eq("user_id", user.id)
            if (error) return { success: false, message: error.message }

            // Cancel any unsent reminders for this plan
            supabase.from("reminders").delete().eq("plan_id", plan_id).eq("is_sent", false).then(undefined, () => {})

            // Delete from Google Calendar
            if (existing?.gcal_event_id) {
              try {
                const gcalToken = await getGcalToken()
                if (gcalToken) {
                  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.gcal_event_id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${gcalToken}` },
                  })
                }
              } catch { /* silent */ }
            }

            return { success: true, message: "Plan deleted." }
          },
        }),

        // ── LIST PLANS ─────────────────────────────────────────────────────────
        list_plans: tool({
          description:
            "Retrieve the user's schedule. " +
            "When the user asks about a specific day (e.g. 'Sunday', 'next Monday', 'March 25') " +
            "use date_filter='specific' and pass the resolved YYYY-MM-DD date in specific_date. " +
            "Always resolve day names using the DAY → DATE LOOKUP in the system prompt first. " +
            "Today's plans are already loaded — only call this for non-today queries or to find a plan_id.",
          parameters: z.object({
            date_filter: z.enum(["today", "tomorrow", "this_week", "upcoming", "all", "specific"])
              .describe("Use 'specific' when the user names a day like Sunday or gives a date"),
            specific_date: z.string().optional()
              .describe("YYYY-MM-DD — required when date_filter is 'specific'"),
            category: z.enum(["task", "meeting", "grocery", "work", "personal", "health", "finance", "other", "all"])
              .optional().default("all"),
            status: z.enum(["pending", "done", "cancelled", "all"])
              .optional().default("pending"),
          }),
          execute: async ({ date_filter, specific_date, category, status }) => {
            if (!user) return { success: false, message: "Login required", plans: [] }

            let query = supabase
              .from("plans")
              .select("*")
              .eq("user_id", user.id)
              .order("plan_date", { ascending: true })
              .order("plan_time", { ascending: true, nullsFirst: false })

            if (date_filter === "today")
              query = query.eq("plan_date", currentDate)
            else if (date_filter === "tomorrow")
              query = query.eq("plan_date", addDays(1))
            else if (date_filter === "this_week")
              query = query.gte("plan_date", currentDate).lte("plan_date", addDays(7))
            else if (date_filter === "upcoming")
              query = query.gte("plan_date", currentDate)
            else if (date_filter === "specific" && specific_date)
              query = query.eq("plan_date", specific_date)
            // "all" — no date filter applied

            if (category && category !== "all") query = query.eq("category", category)
            if (status && status !== "all") query = query.eq("status", status)

            const { data, error } = await query.limit(50)
            if (error) return { success: false, message: error.message, plans: [] }
            return {
              success: true,
              plans: data ?? [],
              count: data?.length ?? 0,
              date_filter,
              specific_date: specific_date ?? null,
            }
          },
        }),

        // ── SEARCH PLANS ───────────────────────────────────────────────────────
        search_plans: tool({
          description:
            "Search plans by keyword, title, location, or description. " +
            "Use when user asks 'find my meeting with Ahmed', 'do I have anything about X'.",
          parameters: z.object({
            query: z.string().describe("Search keyword or phrase"),
            category: z.enum(["task", "meeting", "grocery", "work", "personal", "health", "finance", "other", "all"])
              .optional().default("all"),
            status: z.enum(["pending", "done", "cancelled", "all"]).optional().default("all"),
          }),
          execute: async ({ query, category, status }) => {
            if (!user) return { success: false, message: "Login required", plans: [] }

            let dbQuery = supabase
              .from("plans")
              .select("*")
              .eq("user_id", user.id)
              .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
              .order("plan_date", { ascending: false })
              .limit(20)

            if (category && category !== "all") dbQuery = dbQuery.eq("category", category)
            if (status && status !== "all") dbQuery = dbQuery.eq("status", status)

            const { data, error } = await dbQuery
            if (error) return { success: false, message: error.message, plans: [] }
            return { success: true, plans: data ?? [], count: data?.length ?? 0 }
          },
        }),

        // ── MARK DONE ──────────────────────────────────────────────────────────
        mark_done: tool({
          description: "Mark a task or plan as completed. Use list_plans first if you don't have the plan_id.",
          parameters: z.object({
            plan_id: z.string().describe("UUID of the plan to mark as done"),
          }),
          execute: async ({ plan_id }) => {
            if (!user) return { success: false, message: "Login required" }
            const { data: existing } = await supabase.from("plans").select("gcal_event_id, title").eq("id", plan_id).eq("user_id", user.id).single()
            const { data, error } = await supabase
              .from("plans")
              .update({ status: "done", completed_at: new Date().toISOString() })
              .eq("id", plan_id)
              .eq("user_id", user.id)
              .select()
              .single()
            if (error) return { success: false, message: error.message }

            // Update Google Calendar event title to show it's done
            if (existing?.gcal_event_id) {
              try {
                const gcalToken = await getGcalToken()
                if (gcalToken) {
                  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.gcal_event_id}`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${gcalToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ summary: `✅ ${existing.title}` }),
                  })
                }
              } catch { /* silent */ }
            }

            return { success: true, message: "Marked as done ✅", plan: data }
          },
        }),

        // ── SET REMINDER ───────────────────────────────────────────────────────
        set_reminder: tool({
          description: "Schedule a reminder. Use when user says 'remind me', 'notify me', 'alert me at'.",
          parameters: z.object({
            title: z.string().describe("Reminder title or message"),
            remind_at: z.string().describe("ISO datetime in Riyadh time, e.g. 2026-03-23T15:00:00"),
            plan_id: z.string().optional().describe("UUID of the related plan (optional)"),
            channel: z.enum(["push", "whatsapp", "email"]).optional().default("push"),
          }),
          execute: async ({ title, remind_at, plan_id, channel }) => {
            if (!user) return { success: false, message: "Login required" }

            const { data, error } = await supabase
              .from("reminders")
              .insert({
                user_id: user.id,
                title,
                remind_at,
                plan_id: plan_id ?? null,
                channel: channel ?? "push",
                is_sent: false,
              })
              .select()
              .single()

            if (error) return { success: false, message: error.message }

            const when = new Date(remind_at).toLocaleString("en-GB", {
              timeZone: "Asia/Riyadh",
              dateStyle: "medium",
              timeStyle: "short",
            })

            return {
              success: true,
              message: `Reminder set for ${when} via ${channel ?? "push"}.`,
              reminder: data,
            }
          },
        }),

        // ── SAVE MEMORY ────────────────────────────────────────────────────────
        save_memory: tool({
          description:
            "Save a note, fact, idea, or piece of info to the user's Second Brain. " +
            "Use when the user shares something worth keeping: passwords, IDs, important numbers, quotes, ideas.",
          parameters: z.object({
            content: z.string().describe("The information to remember"),
            title: z.string().optional().describe("Short title (optional)"),
            tags: z.array(z.string()).describe("2-5 descriptive tags"),
            memory_type: z.enum(["text", "photo", "voice"]).optional().default("text"),
          }),
          execute: async ({ content, title, tags, memory_type }) => {
            if (!user) return { success: false, message: "Login required" }

            const { data, error } = await supabase
              .from("memories")
              .insert({
                user_id: user.id,
                content,
                title: title ?? null,
                tags,
                type: memory_type ?? "text",
                gregorian_date: currentDate,
                hijri_date: getHijriDate(),
              })
              .select()
              .single()

            if (error) return { success: false, message: error.message }
            return { success: true, message: "Saved to your second brain.", memory: data }
          },
        }),

        // ── SEARCH MEMORIES ────────────────────────────────────────────────────
        search_memories: tool({
          description:
            "Search the user's Second Brain. " +
            "Use when asked 'do you remember', 'what did I say about', 'find my note on'.",
          parameters: z.object({
            query: z.string().describe("Keywords or topic to search for"),
            tag: z.string().optional().describe("Filter by a specific tag"),
          }),
          execute: async ({ query, tag }) => {
            if (!user) return { success: false, message: "Login required", memories: [] }

            let dbQuery = supabase
              .from("memories")
              .select("id, title, content, tags, gregorian_date, hijri_date, type")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(10)

            if (query) dbQuery = dbQuery.or(`content.ilike.%${query}%,title.ilike.%${query}%`)
            if (tag) dbQuery = dbQuery.contains("tags", [tag])

            const { data, error } = await dbQuery
            if (error) return { success: false, message: error.message, memories: [] }
            return { success: true, memories: data ?? [], count: data?.length ?? 0 }
          },
        }),

        // ── STORE FACT ─────────────────────────────────────────────────────────
        store_fact: tool({
          description:
            "Silently store or update a personal fact about the user extracted from conversation. " +
            "Call whenever the user reveals something personal — including corrections to previous facts. " +
            "NEVER announce this call, never mention it, never say 'I've noted that'.",
          parameters: z.object({
            fact: z.string().describe("Plain language fact, e.g. 'Works at Saudi Aramco as a software engineer'"),
            category: z.enum(["work", "family", "health", "finance", "preference", "location", "education", "contact", "general"]),
          }),
          execute: async ({ fact, category }) => {
            if (!user) return { success: false, message: "Login required" }

            // Deduplicate — update if a similar fact exists in the same category
            const { data: existing } = await serviceSupabase
              .from("user_facts")
              .select("id")
              .eq("user_id", user.id)
              .eq("category", category)
              .ilike("fact", `${fact.slice(0, 40)}%`)
              .limit(1)

            if (existing && existing.length > 0) {
              await serviceSupabase
                .from("user_facts")
                .update({ fact, updated_at: new Date().toISOString() })
                .eq("id", existing[0].id)
              return { success: true, message: "Fact updated." }
            }

            const { error } = await serviceSupabase
              .from("user_facts")
              .insert({ user_id: user.id, fact, category })

            if (error) return { success: false, message: error.message }
            return { success: true, message: "Fact stored." }
          },
        }),

        // ── GET MY FACTS ───────────────────────────────────────────────────────
        get_my_facts: tool({
          description:
            "Retrieve all stored facts about the user. " +
            "Use when asked 'what do you know about me', 'tell me about myself'.",
          parameters: z.object({
            category: z.enum(["work", "family", "health", "finance", "preference", "location", "education", "contact", "general", "all"])
              .optional().default("all"),
          }),
          execute: async ({ category }) => {
            if (!user) return { success: false, message: "Login required", facts: [] }

            let query = serviceSupabase
              .from("user_facts")
              .select("fact, category, created_at")
              .eq("user_id", user.id)
              .order("category")
              .order("created_at", { ascending: false })

            if (category && category !== "all") query = query.eq("category", category)

            const { data, error } = await query
            if (error) return { success: false, message: error.message, facts: [] }
            return { success: true, facts: data ?? [], count: data?.length ?? 0 }
          },
        }),

        // ── GET TIMELINE ───────────────────────────────────────────────────────
        get_timeline: tool({
          description:
            "Retrieve the user's life timeline. " +
            "Use when asked 'what happened last week', 'summarize my month', 'what did I do recently'.",
          parameters: z.object({
            days_back: z.number().min(1).max(365).default(7)
              .describe("How many days back. 7=week, 30=month."),
            source_type: z.enum(["plan_created", "plan_completed", "memory_saved", "file_uploaded", "voice_recorded", "fact_learned", "all"])
              .optional().default("all"),
          }),
          execute: async ({ days_back, source_type }) => {
            if (!user) return { success: false, message: "Login required", events: [] }

            let query = serviceSupabase
              .from("timeline_events")
              .select("title, description, event_date, source_type, importance")
              .eq("user_id", user.id)
              .gte("event_date", addDays(-days_back))
              .order("event_date", { ascending: false })
              .order("importance", { ascending: false })
              .limit(40)

            if (source_type && source_type !== "all") query = query.eq("source_type", source_type)

            const { data, error } = await query
            if (error) return { success: false, message: error.message, events: [] }
            return { success: true, events: data ?? [], count: data?.length ?? 0, days_back }
          },
        }),

      }, // end tools
    })

    trackEvent("search_performed", { type: "chat" })
    return result.toDataStreamResponse()

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error"
    console.error("[Thakirni] Chat API error:", msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}