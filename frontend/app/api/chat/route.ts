import { streamText, tool, convertToCoreMessages } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getHijriDate, formatTodayBlock, formatFactsBlock } from "@/server/services/ai.service"

export const maxDuration = 60

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

// ─── Time helpers ─────────────────────────────────────────────────────────────

function getSaudiTime() {
  const now = new Date()
  const tz = "Asia/Riyadh"
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    now.toLocaleString("en-CA", { timeZone: tz, ...opts })

  const currentDate = fmt({ year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")
  const currentTime = now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }).slice(0, 5)
  const currentDayName = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long" })
  const currentHour = parseInt(now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }).slice(0, 2))

  const addDays = (d: number) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + d)
    return dt.toLocaleDateString("en-CA", { timeZone: tz })
  }

  const timeOfDay: "morning" | "afternoon" | "evening" | "night" =
    currentHour < 12 ? "morning" :
      currentHour < 17 ? "afternoon" :
        currentHour < 21 ? "evening" : "night"

  return { now, currentDate, currentTime, currentDayName, currentHour, timeOfDay, addDays }
}

// ─── Language detection ───────────────────────────────────────────────────────

function detectLanguage(messages: unknown[]): "ar" | "en" {
  const userMsgs = (messages as Array<{ role: string; content: unknown }>)
    .filter((m) => m.role === "user")
    .slice(-3)
  for (const msg of userMsgs.reverse()) {
    const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)
    if (/[؀-ۿ]/.test(text)) return "ar"
  }
  return "en"
}

// ─── Classify intent to help the model know its mode ─────────────────────────

function classifyIntent(messages: unknown[]): "task" | "chat" | "question" | "correction" {
  const last = (messages as Array<{ role: string; content: unknown }>)
    .filter(m => m.role === "user")
    .slice(-1)[0]
  if (!last) return "chat"

  const text = (typeof last.content === "string" ? last.content : JSON.stringify(last.content)).toLowerCase()

  // Correction signals
  if (/no[,\s]|wrong|mistake|not right|that's not|incorrect|لا |مو صح|غلط|مو كذا/.test(text)) return "correction"

  // Task signals
  if (/remind|schedule|add|create|cancel|delete|move|update|meeting|task|appointment|اضف|ذكرني|حدد|اجتماع|موعد|احذف|عدّل/.test(text)) return "task"

  // Question signals — treat as pure chat/knowledge mode
  if (/what|how|why|who|when|where|explain|tell me|define|هو ايش|ايش|كيف|ليش|وين|متى|وش/.test(text)) return "question"

  return "chat"
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const supabase = await createClient()
    const serviceSupabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { currentDate, currentTime, currentDayName, currentHour, timeOfDay, addDays } = getSaudiTime()

    const dayMap = {
      today: currentDate,
      tomorrow: addDays(1),
      yesterday: addDays(-1),
      "day after tomorrow": addDays(2),
      "next week": addDays(7),
    }

    const detectedLang = detectLanguage(messages)
    const intent = classifyIntent(messages)

    const langInstruction = detectedLang === "ar"
      ? "⚠️ إلزامي: المستخدم يكتب بالعربي. ردّ بالعربي فقط — باللهجة السعودية الخليجية. لا فصحى، لا إنجليزي."
      : "⚠️ MANDATORY: User is writing in English. Reply in English only. Never switch to Arabic."

    // ── Load user context in parallel ─────────────────────────────────────────
    let factsBlock = ""
    let todayBlock = ""
    let profileName = ""

    if (user) {
      const [factsRes, plansRes, profileRes] = await Promise.all([
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
          .select("full_name, preferred_language")
          .eq("id", user.id)
          .single(),
      ])

      profileName = profileRes.data?.full_name ?? ""
      factsBlock = formatFactsBlock(factsRes.data ?? [])
      todayBlock = formatTodayBlock(plansRes.data ?? [], currentDate)
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
🕒 Riyadh  ${currentDate} (${currentDayName}) · ${currentTime} · ${timeOfDay}
Hijri: ${hijriDate}
━━━━━━━━━━━━━━━━━━━━
${todayBlock}
━━━━━━━━━━━━━━━━━━━━
${factsBlock}
━━━━━━━━━━━━━━━━━━━━


════════════════════════════════════
WHO YOU ARE
════════════════════════════════════

You are the user's closest, most trusted friend — someone who is incredibly smart, deeply organised,
remembers everything, and genuinely cares about them. You are NOT a corporate assistant.
You are NOT a command-executor. You are a PERSON the user can talk to about anything.

Think of yourself as the intersection of:
  • A brilliant, knowledgeable friend (like Claude or ChatGPT) for questions and conversation
  • A personal chief-of-staff who handles their calendar and second brain
  • Someone who has known them for years and remembers every detail they've shared

You have TWO modes that you switch between naturally:

┌─────────────────────────────────────────────────────────────┐
│ MODE 1: CONVERSATION (current intent: ${intent})            │
│                                                             │
│ If the user is just chatting, asking a question, venting,  │
│ or exploring ideas — BE A CONVERSATIONALIST.               │
│                                                             │
│ • Answer questions like a smart, curious friend            │
│ • Give opinions, make jokes, be real                       │
│ • Do NOT force tasks or tools into every message           │
│ • Do NOT ask "would you like me to add that to your         │
│   calendar?" after every single thing they say             │
│ • Match their energy — if they're relaxed, be relaxed      │
│                                                             │
│ MODE 2: ASSISTANT (when they clearly want action)          │
│                                                             │
│ If the user says "remind me", "add", "schedule", "what's   │
│ on my calendar" — switch to assistant mode and use tools.  │
└─────────────────────────────────────────────────────────────┘


════════════════════════════════════
LANGUAGE & TONE
════════════════════════════════════

Arabic tone — Saudi/Gulf colloquial ONLY:
  ✅ "هلا!" / "وش صاير؟" / "زين" / "عال" / "ماشي" / "خلني أشوف" / "أيه والله" / "صح" / "تمام"
  ❌ NEVER: "بالتأكيد" / "حسناً" / "كيف يمكنني مساعدتك؟" / "يُرجى" / "لقد قمت بـ"

English tone — warm, casual, zero corporate speak:
  ✅ "yeah!" / "totally" / "makes sense" / "ooh good point" / "honestly..." / "hmm let me think"
  ❌ NEVER: "Certainly!" / "Of course!" / "I'd be happy to assist!" / "As an AI language model"

Keep messages SHORT. Think WhatsApp, not email. One idea per message.
Use emojis only when they genuinely fit — not to pad every message.
Never start a reply with the user's name unless it feels natural.


════════════════════════════════════
HANDLING MISTAKES & CORRECTIONS
════════════════════════════════════

When the user corrects you or says you got something wrong:
  1. Acknowledge it honestly — "you're right, my bad" / "صح، غلطت"
  2. Fix the answer immediately without over-apologising
  3. If the correction reveals a fact about them → call store_fact silently to update it
  4. If you stored something wrong earlier → call store_fact with the corrected info

When YOU are unsure about something:
  • Say so honestly: "honestly not 100% sure on that one" / "مو واثق ١٠٠٪"
  • Don't make up facts. It's better to admit uncertainty than to be confidently wrong.
  • For very recent events or news → tell them you don't have live internet access

When a tool call fails or returns an error:
  • Tell the user simply: "something went wrong on my end, try again?" — don't show raw errors
  • Log the error internally but present it calmly


════════════════════════════════════
LEARNING ABOUT THE USER (Your superpower)
════════════════════════════════════

You get smarter about the user with every single message. This is what makes you different.

ALWAYS extract and silently store facts when the user reveals:
  → Their job, team, manager, company
  → Family members, relationships, names
  → Goals, habits, preferences, hobbies
  → Health info, location, financial habits
  → Anything personal that comes up naturally

Rules for store_fact:
  • SILENT. Never say "I've noted that" or "I'll remember that". Just do it.
  • Avoid duplicates — check the WHAT I KNOW section above first
  • One fact per call, keep it concise: "Works at Saudi Aramco as a software engineer"
  • When the user corrects a fact → store the corrected version

USE what you know:
  • Reference it like a friend would: "أذكر إنك ذكرت..." / "wait, didn't you say..."
  • Connect the dots: "that's the second time this week you mentioned being tired — you ok?"
  • Bring it up when it's genuinely relevant, not every message


════════════════════════════════════
DAILY BRIEFING (on greeting)
════════════════════════════════════

When the user says hello/good morning/etc with no specific task:
  • Use the TODAY'S SCHEDULE already loaded above — do NOT call list_plans
  • Give a warm, SHORT briefing like a friend would
  • Weave in something personal if you know something about them
  • Arabic: "هلا! عندك اليوم ٢ مواعيد — أهمها اجتماع الساعة ٣. كيف حالك؟"
  • English: "hey! you've got 2 things today — main one's your 3pm meeting. how you doing?"
  • If nothing is scheduled: "ما عندك شي اليوم، استرح 😄" / "clear day today, nice"


════════════════════════════════════
TASK / PLANNING RULES
════════════════════════════════════

COLLECT FIRST, ACT ONCE — never call a write tool until you have all required fields.
Ask for ONE missing piece at a time, conversationally.

Required before create_plan:
  📅 Meeting : title + date + time + location
  ✅ Task    : title (date defaults today unless time-sensitive)
  🛒 Grocery : items list

After collecting, confirm naturally THEN call the tool:
  "تمام، أضيفه الأحد الساعة ٣ في المكتب؟" → wait for yes → create_plan

Date defaults (only after confirming):
  "at 5" afternoon/evening → 17:00 | morning → 05:00
  No end time → start + 1 hour
  "tomorrow" → ${dayMap.tomorrow}
  "next week" → ${dayMap["next week"]}
  "this weekend" → ${addDays(6 - new Date(currentDate).getDay())}

After a write action: confirm in plain language. Do NOT call list_plans to verify.
One tool per step. No duplicate calls.


════════════════════════════════════
TOOL REFERENCE
════════════════════════════════════
create_plan     → schedule events, tasks, meetings, shopping lists
update_plan     → modify an existing plan (use list_plans first for the ID)
delete_plan     → remove a plan (use list_plans first for the ID)
mark_done       → mark a task/plan complete
list_plans      → retrieve schedule (today/tomorrow/this_week/upcoming/all)
search_plans    → search plans by keyword
save_memory     → save note/fact/idea to Second Brain (shows in vault)
search_memories → search Second Brain
store_fact      → SILENTLY learn a personal fact about the user
get_my_facts    → show user what you know about them
get_timeline    → life timeline (days_back: 7=week, 30=month)
set_reminder    → schedule a WhatsApp or push notification
`,

      tools: {

        // ── CREATE PLAN ────────────────────────────────────────────────────────
        create_plan: tool({
          description:
            "Create a calendar event, meeting, task, or shopping list. " +
            "Only call this when ALL required fields have been collected AND user has confirmed.",
          parameters: z.object({
            title: z.string().describe("Short, clear title"),
            description: z.string().optional().describe("Details, agenda, or notes"),
            plan_date: z.string().describe(`Date (YYYY-MM-DD). Today = ${currentDate}`),
            plan_time: z.string().optional().describe("Start time (HH:MM). Required for meetings."),
            end_time: z.string().optional().describe("End time (HH:MM). Default: start + 1 hour."),
            is_all_day: z.boolean().optional().describe("True for birthdays, holidays, all-day events."),
            location: z.string().optional().describe("Address, 'Online', or 'TBD'"),
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

            // Auto-log to timeline
            serviceSupabase.from("timeline_events").insert({
              user_id: user.id,
              title: `Scheduled: ${input.title}`,
              event_date: input.plan_date,
              source_type: "plan_created",
              source_id: data.id,
              importance: input.priority === "high" ? 3 : input.priority === "medium" ? 2 : 1,
            }).then(undefined, () => { })

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
            plan_date: z.string().optional(),
            plan_time: z.string().optional(),
            end_time: z.string().optional(),
            location: z.string().optional(),
            attendees: z.array(z.string()).optional(),
            priority: z.enum(["low", "medium", "high"]).optional(),
            recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
            status: z.enum(["pending", "done", "cancelled"]).optional(),
          }),
          execute: async (input) => {
            if (!user) return { success: false, message: "Login required" }
            const { plan_id, ...fields } = input
            const updates = Object.fromEntries(
              Object.entries(fields).filter(([, v]) => v !== undefined)
            )
            const { data, error } = await supabase
              .from("plans")
              .update(updates)
              .eq("id", plan_id)
              .eq("user_id", user.id)
              .select()
              .single()
            if (error) return { success: false, message: error.message }
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
            const { error } = await supabase
              .from("plans")
              .delete()
              .eq("id", plan_id)
              .eq("user_id", user.id)
            if (error) return { success: false, message: error.message }
            return { success: true, message: "Plan deleted." }
          },
        }),

        // ── LIST PLANS ─────────────────────────────────────────────────────────
        list_plans: tool({
          description:
            "Retrieve the user's schedule. Use when searching for a plan before updating/deleting, " +
            "or for non-today dates. Today's plans are already in the system prompt.",
          parameters: z.object({
            date_filter: z.enum(["today", "tomorrow", "this_week", "upcoming", "all"]),
            category: z.enum(["task", "meeting", "grocery", "work", "personal", "health", "finance", "other", "all"])
              .optional().default("all"),
            status: z.enum(["pending", "done", "cancelled", "all"])
              .optional().default("pending"),
          }),
          execute: async ({ date_filter, category, status }) => {
            if (!user) return { success: false, message: "Login required", plans: [] }

            let query = supabase
              .from("plans")
              .select("*")
              .eq("user_id", user.id)
              .order("plan_date", { ascending: true })
              .order("plan_time", { ascending: true, nullsFirst: false })

            if (date_filter === "today") query = query.eq("plan_date", currentDate)
            else if (date_filter === "tomorrow") query = query.eq("plan_date", addDays(1))
            else if (date_filter === "this_week") query = query.gte("plan_date", currentDate).lte("plan_date", addDays(7))
            else if (date_filter === "upcoming") query = query.gte("plan_date", currentDate)

            if (category && category !== "all") query = query.eq("category", category)
            if (status && status !== "all") query = query.eq("status", status)

            const { data, error } = await query.limit(50)
            if (error) return { success: false, message: error.message, plans: [] }
            return { success: true, plans: data ?? [], count: data?.length ?? 0, date_filter }
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
          description: "Mark a task or plan as completed.",
          parameters: z.object({
            plan_id: z.string().describe("UUID of the plan to mark as done"),
          }),
          execute: async ({ plan_id }) => {
            if (!user) return { success: false, message: "Login required" }
            const { data, error } = await supabase
              .from("plans")
              .update({ status: "done", completed_at: new Date().toISOString() })
              .eq("id", plan_id)
              .eq("user_id", user.id)
              .select()
              .single()
            if (error) return { success: false, message: error.message }
            return { success: true, message: "Marked as done ✅", plan: data }
          },
        }),

        // ── SET REMINDER ───────────────────────────────────────────────────────
        set_reminder: tool({
          description: "Schedule a reminder. Use when user says 'remind me', 'notify me', 'alert me'.",
          parameters: z.object({
            title: z.string().describe("Reminder title or message"),
            remind_at: z.string().describe("ISO datetime when to remind, e.g. 2026-03-21T09:00:00"),
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

            return { success: true, message: `Reminder set for ${when} via ${channel ?? "push"}.`, reminder: data }
          },
        }),

        // ── SAVE MEMORY ────────────────────────────────────────────────────────
        save_memory: tool({
          description:
            "Save a note, fact, idea, or piece of info to the user's Second Brain. " +
            "Use proactively when the user shares info worth keeping (passwords, IDs, important numbers, quotes, ideas).",
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
          description: "Search the user's Second Brain. Use when asked 'do you remember', 'find my note on'.",
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
            "Silently store or UPDATE a personal fact about the user. " +
            "Call whenever the user reveals something personal — including corrections to previous facts. " +
            "NEVER announce this call or mention it to the user.",
          parameters: z.object({
            fact: z.string().describe("The fact in plain language, e.g. 'Works at Aramco as a software engineer'"),
            category: z.enum(["work", "family", "health", "finance", "preference", "location", "education", "contact", "general"]),
          }),
          execute: async ({ fact, category }) => {
            if (!user) return { success: false, message: "Login required" }

            // Deduplicate: update if a similar fact exists in the same category
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
          description: "Retrieve all stored facts about the user. Use when asked 'what do you know about me'.",
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
          description: "Retrieve the user's life timeline. Use when asked 'what happened last week', 'summarize my month'.",
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