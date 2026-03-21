import { streamText, tool, convertToCoreMessages } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getHijriDate, formatTodayBlock, formatFactsBlock } from "@/server/services/ai.service"

export const maxDuration = 60

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

// ─── Time helpers ─────────────────────────────────────────────────────────────

function getSaudiTime() {
  const now  = new Date()
  const tz   = "Asia/Riyadh"
  const fmt  = (opts: Intl.DateTimeFormatOptions) =>
    now.toLocaleString("en-CA", { timeZone: tz, ...opts })

  const currentDate    = fmt({ year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")
  const currentTime    = now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }).slice(0, 5)
  const currentDayName = now.toLocaleDateString("en-US",  { timeZone: tz, weekday: "long" })
  const currentHour    = parseInt(now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }).slice(0, 2))

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

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const supabase        = await createClient()
    const serviceSupabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { currentDate, currentTime, currentDayName, currentHour, timeOfDay, addDays } = getSaudiTime()

    const dayMap = {
      today:              currentDate,
      tomorrow:           addDays(1),
      yesterday:          addDays(-1),
      "day after tomorrow": addDays(2),
      "next week":        addDays(7),
    }

    const detectedLang = detectLanguage(messages)
    const langInstruction = detectedLang === "ar"
      ? "⚠️ إلزامي: المستخدم يكتب بالعربي. ردّ بالعربي فقط — باللهجة السعودية العامية (الخليجية). لا تستخدم الفصحى الرسمية ولا تخلط مع الإنجليزي أبداً. أمثلة صح: 'وش تبي؟' / 'زين' / 'عال العال' / 'تمام' / 'ماشي' / 'خلني أشوف' / 'إن شاء الله'. أمثلة غلط: 'كيف يمكنني مساعدتك؟' / 'بالتأكيد' / 'حسناً'."
      : "⚠️ MANDATORY: The user is writing in ENGLISH. You MUST reply in English only. Never switch to Arabic."

    // ── Load user context in parallel ──────────────────────────────────────────
    let factsBlock  = ""
    let todayBlock  = ""
    let profileName = ""
    let profileLang: "ar" | "en" = "ar"

    if (user) {
      const [factsRes, plansRes, profileRes] = await Promise.all([

        // Stored personal facts (service role — bypasses RLS)
        serviceSupabase
          .from("user_facts")
          .select("fact, category")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(40),

        // Today's pending plans — pre-loaded so greeting needs no tool call
        supabase
          .from("plans")
          .select("title, plan_time, end_time, category, location, priority, status")
          .eq("user_id", user.id)
          .eq("plan_date", currentDate)
          .eq("status", "pending")
          .order("plan_time", { ascending: true, nullsFirst: false })
          .limit(20),

        // Profile
        supabase
          .from("profiles")
          .select("full_name, preferred_language")
          .eq("id", user.id)
          .single(),
      ])

      profileName = profileRes.data?.full_name ?? ""
      profileLang = (profileRes.data?.preferred_language as "ar" | "en") ?? "ar"

      factsBlock = formatFactsBlock(factsRes.data ?? [])
      todayBlock = formatTodayBlock(plansRes.data ?? [], currentDate)
    }

    const hijriDate = getHijriDate()

    // ── Persist incoming user message (fire-and-forget) ─────────────────────
    const lastUserMessage = messages[messages.length - 1]
    if (user && lastUserMessage?.role === "user") {
      serviceSupabase
        .from("conversations")
        .insert({
          user_id: user.id,
          role:    "user",
          content: typeof lastUserMessage.content === "string"
            ? lastUserMessage.content
            : JSON.stringify(lastUserMessage.content),
        })
        .then(undefined, (err: unknown) =>
          console.error("[Thakirni] Failed to save user message:", err))
    }

    // ── Stream ────────────────────────────────────────────────────────────────
    const result = streamText({
      model:    groq("llama-3.3-70b-versatile"),
      maxSteps: 15,
      messages: convertToCoreMessages(messages),

      onFinish: async ({ text }) => {
        if (!user || !text) return
        try {
          await serviceSupabase.from("conversations").insert({
            user_id: user.id,
            role:    "assistant",
            content: text,
          })
        } catch (err) {
          console.error("[Thakirni] Failed to save assistant message:", err)
        }
      },

      system: `
${langInstruction}

You are Thakirni (ذكرني) — a personal assistant, second brain, and trusted companion. You remember everything, learn from every conversation, and get smarter over time.
${profileName ? `The user's name is ${profileName}.` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━
🕒 NOW  (Riyadh / Saudi Arabia)
  Date : ${currentDate} (${currentDayName})
  Hijri: ${hijriDate}
  Time : ${currentTime} (${timeOfDay})
━━━━━━━━━━━━━━━━━━━━━━━━
${todayBlock}
━━━━━━━━━━━━━━━━━━━━━━━━
${factsBlock}
━━━━━━━━━━━━━━━━━━━━━━━━

════════════════════════
1. WHO YOU ARE
════════════════════════
You are a close, trusted friend who also happens to be perfectly organised and deeply knowledgeable.
You have a memory — everything in "WHAT I KNOW ABOUT YOU" above is yours to use naturally in conversation.
Reference it like a friend would: "أذكر إنك قلت..." / "didn't you mention..." — never like a robot reading a database.

Tone (Arabic): Saudi/Gulf colloquial ONLY.
  ✅ "هلا والله!" / "وش صاير؟" / "زين" / "عال العال" / "ماشي" / "خلني أشوف" / "تبي" / "قاعد" / "راح" / "وين كنت؟"
  ❌ NEVER: "بالتأكيد" / "حسناً" / "كيف يمكنني مساعدتك؟" / "هل تريد أن..." / "يُرجى" / "لقد قمت بـ"
  Keep it short — like a WhatsApp message, not a formal email.

Tone (English): Warm, natural, casual. Like a smart friend, not a corporate chatbot.
  ✅ "sure!" / "got it" / "makes sense" / "let me check" / "sounds good"
  ❌ NEVER: "Certainly!" / "Of course!" / "How may I assist you today?"

The ⚠️ language rule at the top is absolute — never mix languages in one reply.
Use emojis sparingly and only when they feel natural.

════════════════════════
2. CONVERSATION FIRST — ALWAYS
════════════════════════
🚨 CRITICAL: You are a CONVERSATIONALIST, not a command executor.

When someone mentions an event, task, or meeting — DO NOT add it immediately.
Instead, have a brief, natural conversation to understand what they actually need.

MEETING example:
  User: "عندي اجتماع الأحد"
  ❌ WRONG: [immediately calls create_plan]
  ✅ RIGHT: "وش اجتماع؟ مع مين، وين، وكم الساعة؟" — ask naturally, wait for answers, THEN add it.

TASK example:
  User: "I need to call Ahmed"
  ❌ WRONG: [immediately creates task]
  ✅ RIGHT: "Sure — want me to add that as a reminder? When do you need to call him?"

RULE: For ANY create/update/delete action — ask at least ONE clarifying question first
unless the user has already given you every detail in one message (title + date + time + location for meetings).

Required info before create_plan:
  📅 Meeting : title + date + time + location  (ask for each one missing — ONE question at a time)
  ✅ Task     : title (date defaults today, but ask "by when?" if it seems time-sensitive)
  🛒 Grocery : items list

After you have all the info, confirm with the user before creating:
  "تمام، أضيفه الأحد الساعة ١٠ في المكتب؟" / "Got it — I'll add: [summary]. Sound right?"
  Only proceed after they say yes/confirm.

════════════════════════
3. LEARNING & MEMORY (Your superpower)
════════════════════════
You learn something new about the user in EVERY conversation. This is how you get better over time.

A) Extract & store personal facts SILENTLY (NEVER announce it):
   → Any time the user reveals something about themselves: job, family, preferences, habits, location,
     health, goals, relationships — call store_fact immediately.
   → Use the context above ("WHAT I KNOW ABOUT YOU") to avoid saving duplicates.
   → When you already know something, reference it naturally to show you remember.
   → Example: user says "I'm meeting my manager Khalid" → store_fact: "Manager's name is Khalid"

B) Save important notes & info to Second Brain:
   → Passwords, ideas, quotes, important numbers, birthdays → call save_memory with good tags.
   → Briefly confirm: "حفظت" / "Saved to your second brain ✓"

C) Use what you know:
   → If the user mentions something you already have stored, acknowledge it:
     "آه، Khalid مديرك — زين"
   → Connect dots across conversations: "هذا ثاني اجتماع مع الفريق هالأسبوع، شكل مشغول 😄"
   → Ask thoughtful follow-ups based on what you know about them.

D) For sensitive info (IDs, passwords, financial details): call BOTH store_fact AND save_memory.

════════════════════════
4. DAILY BRIEFINGS
════════════════════════
When user greets you (no specific task): give a warm overview using TODAY'S SCHEDULE above.
Do NOT call list_plans — it's already loaded. Mention the count, highlight the most important item.
Arabic: "عندك اليوم ٣ مواعيد..." / "ما عندك شي اليوم، استرح 😄"

If you know something about them (from WHAT I KNOW), weave it in naturally:
  "صباح الخير! عندك اليوم اجتماع مع Khalid الساعة ٢ — اتوقع مشغول اليوم 😄"

════════════════════════
5. DATE / TIME DEFAULTS (only when info is confirmed)
════════════════════════
- "at 5" → 17:00 in afternoon/evening, 05:00 in morning
- No end time → start + 1 hour
- "tomorrow" → ${dayMap.tomorrow}
- "next week" → ${dayMap["next week"]}
- "this weekend" → ${addDays(6 - new Date(currentDate).getDay())}
NOTE: Only apply these AFTER confirming with the user. Never assume and silently create.

════════════════════════
6. TOOL RULES — MANDATORY TWO-STEP FLOW
════════════════════════
🚨 YOU MUST FOLLOW THIS EXACT SEQUENCE FOR ANY PLAN CREATION:

  STEP 1 → Collect all missing info through conversation (ask one question at a time)
  STEP 2 → Call preview_plan (NOT create_plan) — this shows the user a summary card
  STEP 3 → Wait for user to say yes / تمام / ماشي / confirm / أضفه / add it
  STEP 4 → ONLY THEN call create_plan

NEVER call create_plan directly. ALWAYS call preview_plan first.
preview_plan does NOT save anything — it just shows the user what will be created.
create_plan saves to the database — only call it after the user explicitly confirms.

Same rule for delete_plan: always tell the user what you're about to delete and wait for confirmation.
update_plan: tell the user what will change, wait for confirmation.

Other rules:
- One tool per step. No duplicate calls.
- After create_plan succeeds: confirm warmly in natural language. Don't call list_plans to verify.
- store_fact: ALWAYS silent — never mention it to the user.

════════════════════════
7. TOOL REFERENCE
════════════════════════
preview_plan     → show a confirmation card to user BEFORE saving (always use this first)
create_plan      → save to database — ONLY after user confirms the preview
update_plan      → modify an existing plan (use list_plans first to get the ID)
delete_plan      → remove a plan (use list_plans first to get the ID)
mark_done        → mark a task/plan complete
list_plans       → retrieve schedule (date_filter: today/tomorrow/this_week/upcoming/all)
search_plans     → search plans by keyword or free text
save_memory      → save note/fact/idea to Second Brain (visible in vault)
search_memories  → search Second Brain by keyword or tag
store_fact       → silently learn a personal fact about the user
get_my_facts     → show user what you know about them
get_timeline     → show life timeline (days_back: 7=week, 30=month)
set_reminder     → schedule a WhatsApp or push notification for a plan
`,

      tools: {

        // ── PREVIEW PLAN (confirmation step — no DB write) ─────────────────────
        preview_plan: tool({
          description:
            "Show the user a summary of the plan about to be created. " +
            "ALWAYS call this BEFORE create_plan. It does NOT save anything. " +
            "After calling this, wait for the user to confirm before calling create_plan.",
          parameters: z.object({
            title:      z.string(),
            plan_date:  z.string().describe("YYYY-MM-DD"),
            plan_time:  z.string().optional().describe("HH:MM"),
            end_time:   z.string().optional(),
            location:   z.string().optional(),
            attendees:  z.array(z.string()).optional(),
            category:   z.enum(["task","meeting","grocery","work","personal","health","finance","other"]),
            priority:   z.enum(["low","medium","high"]).optional(),
          }),
          execute: async (input) => {
            return {
              preview: true,
              ...input,
              message: "Preview ready — waiting for user confirmation.",
            }
          },
        }),

        // ── CREATE PLAN ────────────────────────────────────────────────────────
        create_plan: tool({
          description:
            "Save a plan to the database. ONLY call this after preview_plan was shown " +
            "AND the user explicitly confirmed (said yes/تمام/ماشي/confirm/أضفه).",
          parameters: z.object({
            title:       z.string().describe("Short, clear title"),
            description: z.string().optional().describe("Details, agenda, or notes"),
            plan_date:   z.string().describe(`Date (YYYY-MM-DD). Today = ${currentDate}`),
            plan_time:   z.string().optional().describe("Start time (HH:MM). Required for meetings."),
            end_time:    z.string().optional().describe("End time (HH:MM). Default: start + 1 hour."),
            is_all_day:  z.boolean().optional().describe("True for birthdays, holidays, all-day events."),
            location:    z.string().optional().describe("Address, 'Online', or 'TBD'"),
            attendees:   z.array(z.string()).optional().describe("Names or emails"),
            category:    z.enum(["task","meeting","grocery","work","personal","health","finance","other"])
                          .describe("Auto-detect from context"),
            priority:    z.enum(["low","medium","high"]).optional().default("medium"),
            recurrence:  z.enum(["none","daily","weekly","monthly","yearly"]).optional().default("none"),
          }),
          execute: async (input) => {
            if (!user) return { success: false, message: "Login required" }

            // Auto-calculate end time
            let endTime = input.end_time
            if (input.plan_time && !endTime) {
              const [h, m] = input.plan_time.split(":").map(Number)
              endTime = `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
            }

            const { data, error } = await supabase
              .from("plans")
              .insert({
                user_id:     user.id,
                title:       input.title,
                description: input.description ?? null,
                plan_date:   input.plan_date,
                plan_time:   input.plan_time ?? null,
                end_time:    endTime ?? null,
                location:    input.location ?? null,
                attendees:   input.attendees ?? [],
                category:    input.category,
                priority:    input.priority ?? "medium",
                recurrence:  input.recurrence ?? "none",
                is_all_day:  input.is_all_day ?? false,
                status:      "pending",
              })
              .select()
              .single()

            if (error) return { success: false, message: error.message }

            // Auto-log to timeline
            serviceSupabase.from("timeline_events").insert({
              user_id:     user.id,
              title:       `Scheduled: ${input.title}`,
              event_date:  input.plan_date,
              source_type: "plan_created",
              source_id:   data.id,
              importance:  input.priority === "high" ? 3 : input.priority === "medium" ? 2 : 1,
            }).then(undefined, () => {})

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
            plan_id:     z.string().describe("UUID of the plan"),
            title:       z.string().optional(),
            description: z.string().optional(),
            plan_date:   z.string().optional(),
            plan_time:   z.string().optional(),
            end_time:    z.string().optional(),
            location:    z.string().optional(),
            attendees:   z.array(z.string()).optional(),
            priority:    z.enum(["low","medium","high"]).optional(),
            recurrence:  z.enum(["none","daily","weekly","monthly","yearly"]).optional(),
            status:      z.enum(["pending","done","cancelled"]).optional(),
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
            "Retrieve the user's schedule. Use for searching for a specific plan before " +
            "updating/deleting, or when asked to list plans for a non-today date. " +
            "Today's plans are already in the system prompt — no need to call this for today's briefing.",
          parameters: z.object({
            date_filter: z.enum(["today","tomorrow","this_week","upcoming","all"]),
            category:    z.enum(["task","meeting","grocery","work","personal","health","finance","other","all"])
                          .optional().default("all"),
            status:      z.enum(["pending","done","cancelled","all"])
                          .optional().default("pending"),
          }),
          execute: async ({ date_filter, category, status }) => {
            if (!user) return { success: false, message: "Login required", plans: [] }

            let query = supabase
              .from("plans")
              .select("*")
              .eq("user_id", user.id)
              .order("plan_date",  { ascending: true })
              .order("plan_time",  { ascending: true, nullsFirst: false })

            if (date_filter === "today")      query = query.eq("plan_date", currentDate)
            else if (date_filter === "tomorrow") query = query.eq("plan_date", addDays(1))
            else if (date_filter === "this_week") query = query.gte("plan_date", currentDate).lte("plan_date", addDays(7))
            else if (date_filter === "upcoming")  query = query.gte("plan_date", currentDate)

            if (category && category !== "all") query = query.eq("category", category)
            if (status   && status   !== "all") query = query.eq("status",   status)

            const { data, error } = await query.limit(50)
            if (error) return { success: false, message: error.message, plans: [] }
            return { success: true, plans: data ?? [], count: data?.length ?? 0, date_filter }
          },
        }),

        // ── SEARCH PLANS ───────────────────────────────────────────────────────
        search_plans: tool({
          description:
            "Search plans by keyword, title, location, or description. " +
            "Use when user asks 'find my meeting with Ahmed', 'do I have anything about X', etc.",
          parameters: z.object({
            query:    z.string().describe("Search keyword or phrase"),
            category: z.enum(["task","meeting","grocery","work","personal","health","finance","other","all"])
                        .optional().default("all"),
            status:   z.enum(["pending","done","cancelled","all"]).optional().default("all"),
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
            if (status   && status   !== "all") dbQuery = dbQuery.eq("status",   status)

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
          description:
            "Schedule a reminder for a plan or any custom time. " +
            "Use when the user says 'remind me', 'notify me', 'alert me at', etc.",
          parameters: z.object({
            title:      z.string().describe("Reminder title or message"),
            remind_at:  z.string().describe("ISO datetime when to remind, e.g. 2026-03-19T09:00:00"),
            plan_id:    z.string().optional().describe("UUID of the related plan (optional)"),
            channel:    z.enum(["push","whatsapp","email"]).optional().default("push")
                          .describe("Delivery channel. Default is push notification."),
          }),
          execute: async ({ title, remind_at, plan_id, channel }) => {
            if (!user) return { success: false, message: "Login required" }

            const { data, error } = await supabase
              .from("reminders")
              .insert({
                user_id:   user.id,
                title,
                remind_at,
                plan_id:   plan_id ?? null,
                channel:   channel ?? "push",
                is_sent:   false,
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
            "Use proactively when the user shares info without any time/date context.",
          parameters: z.object({
            content:     z.string().describe("The information to remember"),
            title:       z.string().optional().describe("Short title (optional)"),
            tags:        z.array(z.string()).describe("2-5 descriptive tags"),
            memory_type: z.enum(["text","photo","voice"]).optional().default("text"),
          }),
          execute: async ({ content, title, tags, memory_type }) => {
            if (!user) return { success: false, message: "Login required" }

            const hijriNow = getHijriDate()

            const { data, error } = await supabase
              .from("memories")
              .insert({
                user_id:        user.id,
                content,
                title:          title ?? null,
                tags,
                type:           memory_type ?? "text",
                gregorian_date: currentDate,
                hijri_date:     hijriNow,
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
            "Search the user's Second Brain for saved notes or facts. " +
            "Use when asked: 'do you remember', 'what did I say about', 'find my note on'.",
          parameters: z.object({
            query: z.string().describe("Keywords or topic to search for"),
            tag:   z.string().optional().describe("Filter by a specific tag"),
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
            if (tag)   dbQuery = dbQuery.contains("tags", [tag])

            const { data, error } = await dbQuery
            if (error) return { success: false, message: error.message, memories: [] }
            return { success: true, memories: data ?? [], count: data?.length ?? 0 }
          },
        }),

        // ── STORE FACT ─────────────────────────────────────────────────────────
        store_fact: tool({
          description:
            "Silently store a personal fact about the user extracted from conversation. " +
            "Call whenever the user reveals something personal. Do NOT announce this call.",
          parameters: z.object({
            fact:     z.string().describe("The fact in plain language, e.g. 'Works at Aramco as a software engineer'"),
            category: z.enum(["work","family","health","finance","preference","location","education","contact","general"]),
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
          description:
            "Retrieve all stored facts about the user. " +
            "Use when asked: 'what do you know about me', 'tell me about myself'.",
          parameters: z.object({
            category: z.enum(["work","family","health","finance","preference","location","education","contact","general","all"])
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
            "Retrieve the user's life timeline. Use when asked: 'what happened last week', " +
            "'summarize my month', 'what did I do recently'.",
          parameters: z.object({
            days_back:   z.number().min(1).max(365).default(7)
                          .describe("How many days back to look. 7=week, 30=month."),
            source_type: z.enum(["plan_created","plan_completed","memory_saved","file_uploaded","voice_recorded","fact_learned","all"])
                          .optional().default("all"),
          }),
          execute: async ({ days_back, source_type }) => {
            if (!user) return { success: false, message: "Login required", events: [] }

            let query = serviceSupabase
              .from("timeline_events")
              .select("title, description, event_date, source_type, importance")
              .eq("user_id", user.id)
              .gte("event_date", addDays(-days_back))
              .order("event_date",  { ascending: false })
              .order("importance",  { ascending: false })
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
