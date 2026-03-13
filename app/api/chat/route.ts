import { streamText, tool, convertToCoreMessages } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// ─── Time Helpers ─────────────────────────────────────────────────────────────

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

  return { now, currentDate, currentTime, currentDayName, currentHour, addDays }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { currentDate, currentTime, currentDayName, currentHour, addDays } = getSaudiTime()

    const dayMap = {
      today: currentDate,
      tomorrow: addDays(1),
      yesterday: addDays(-1),
      "day after tomorrow": addDays(2),
    }

    const timeOfDay =
      currentHour < 12 ? "morning" :
        currentHour < 17 ? "afternoon" :
          currentHour < 21 ? "evening" : "night"

    // ── Load user context in parallel ─────────────────────────────────────────
    let factsBlock = ""
    let historyBlock = ""
    let profileName = ""

    if (user) {
      const [factsRes, historyRes, profileRes] = await Promise.all([

        // Last 30 stored personal facts
        supabase
          .from("user_facts")
          .select("fact, category")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),

        // Last 20 conversation turns for short-term memory
        supabase
          .from("conversations")
          .select("role, content, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),

        // User display name
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single(),
      ])

      profileName = profileRes.data?.full_name ?? ""

      // Group facts by category for a clean system prompt block
      if (factsRes.data && factsRes.data.length > 0) {
        const byCategory: Record<string, string[]> = {}
        for (const { fact, category } of factsRes.data) {
          if (!byCategory[category]) byCategory[category] = []
          byCategory[category].push(fact)
        }
        const lines = Object.entries(byCategory)
          .map(([cat, facts]) =>
            `  [${cat}]\n${facts.map(f => `    • ${f}`).join("\n")}`)
          .join("\n")
        factsBlock = `\n━━━━━━━━━━━━━━━━━━━━━━━━\n🧠 WHAT I KNOW ABOUT YOU\n${lines}\n━━━━━━━━━━━━━━━━━━━━━━━━`
      }

      // Recent history oldest-first so the AI reads it chronologically
      if (historyRes.data && historyRes.data.length > 0) {
        const turns = [...historyRes.data].reverse()
        const lines = turns
          .map(t =>
            `  [${t.role === "user" ? "You" : "Thakirni"}]: ${t.content.slice(0, 200)}`)
          .join("\n")
        historyBlock = `\n━━━━━━━━━━━━━━━━━━━━━━━━\n💬 RECENT CONVERSATION HISTORY\n${lines}\n━━━━━━━━━━━━━━━━━━━━━━━━`
      }
    }

    // ── Persist incoming user message (fire-and-forget) ───────────────────────
    const lastUserMessage = messages[messages.length - 1]
    if (user && lastUserMessage?.role === "user") {
      supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          role: "user",
          content: typeof lastUserMessage.content === "string"
            ? lastUserMessage.content
            : JSON.stringify(lastUserMessage.content),
        })
        .then()
        .catch(err => console.error("[Thakirni] Failed to save user message:", err))
    }

    // ── Stream ────────────────────────────────────────────────────────────────
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      maxSteps: 10,
      messages: convertToCoreMessages(messages),

      // Persist the assistant's final reply after streaming finishes
      onFinish: async ({ text }) => {
        if (!user || !text) return
        try {
          await supabase.from("conversations").insert({
            user_id: user.id,
            role: "assistant",
            content: text,
          })
        } catch (err) {
          console.error("[Thakirni] Failed to save assistant message:", err)
        }
      },

      system: `
You are **Thakirni (ذكرني)** — a warm, intelligent personal assistant that acts as the user's second brain.
Your personality: friendly, proactive, organised, like a trusted chief-of-staff who remembers everything.
${profileName ? `\nThe user's name is: ${profileName}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━
🕒 CURRENT CONTEXT (Saudi Arabia / Riyadh)
  Date     : ${currentDate} (${currentDayName})
  Time     : ${currentTime}  (${timeOfDay})
  Tomorrow : ${dayMap.tomorrow}
━━━━━━━━━━━━━━━━━━━━━━━━
${factsBlock}
${historyBlock}

════════════════════════════════════════
CORE PHILOSOPHY — READ CAREFULLY
════════════════════════════════════════

1. **COLLECT FIRST, ACT ONCE**
   Never call a write tool (create_plan / save_memory / update_plan / delete_plan)
   until you have *all required fields*. Ask for ONE missing field at a time.
   After creating/updating, confirm in plain language — do NOT call list_plans to verify.

2. **PROACTIVE BRIEFINGS**
   When a user says hello, good morning, or checks in with no specific task,
   call list_plans with date_filter="today" and give a warm daily briefing.
   If there are no plans, encourage them and ask what they'd like to accomplish.

3. **SMART DISAMBIGUATION**
   - "at 5" in the morning → assume 05:00; if afternoon/evening → assume 17:00
   - No end time given → default +1 hour
   - No date given for a task → default to today
   - "next week" → ${addDays(7)}
   - "this weekend" → ${addDays(6 - new Date(currentDate).getDay())} (nearest Saturday)

4. **SECOND BRAIN MODE**
   If the user shares a fact, idea, quote, or piece of info with no time attached,
   call save_memory automatically — don't ask, just do it and confirm.
   Examples: "My car plate is XYZ", "Ahmed's birthday is in March", "My wifi password is 1234".

5. **FACT EXTRACTION — CRITICAL**
   When the user reveals a personal fact about themselves, ALWAYS call store_fact silently.
   Personal facts include:
     - Job / employer / role  ("I work at Aramco as an engineer")
     - Family                 ("I have two kids", "my wife is Sara")
     - Location               ("I live in Dammam")
     - Health                 ("I have diabetes", "I run every morning")
     - Preferences            ("I prefer morning meetings", "I don't drink coffee")
     - Education              ("I studied at KFUPM")
     - Contacts               ("Ahmed's number is 05xxxxxxxx")
   Call store_fact WITHOUT announcing it — just continue the conversation naturally.
   Check the WHAT I KNOW ABOUT YOU section to avoid storing duplicates.

6. **LANGUAGE MIRRORING**
   Always reply in the same language the user used. If Arabic, reply in Arabic.
   Switch fluidly mid-conversation.

7. **EMOTIONAL INTELLIGENCE**
   If user seems stressed (lots of tasks, tight deadlines), acknowledge it with empathy
   before diving into logistics.

8. **USE HISTORY**
   The RECENT CONVERSATION HISTORY above shows past messages.
   Reference it naturally — e.g. "As you mentioned earlier..." or
   "Following up on what you said about..."
   Never pretend you don't remember something clearly in the history.

════════════════════════════════════════
REQUIRED FIELDS CHECKLIST
════════════════════════════════════════

📅 MEETING / APPOINTMENT (all required before calling create_plan):
  ✅ Title
  ✅ Date  (resolve from user's words using the date map above)
  ✅ Time  (HH:MM)
  ✅ Location  (physical address OR "Online" OR "TBD")
  ○  Attendees, description, recurrence — optional

✅ TASK (required before calling create_plan):
  ✅ Title
  ○  Date (default: today), Time, Priority — optional

🛒 GROCERY / SHOPPING LIST:
  ✅ Items array
  ○  Date (default: today)

🧠 MEMORY / NOTE (call save_memory immediately, no questions needed):
  ✅ Content
  ✅ Tags  (auto-generate 2-4 relevant tags)

🧬 PERSONAL FACT (call store_fact silently, no announcement):
  ✅ fact
  ✅ category

════════════════════════════════════════
EXAMPLE FLOWS
════════════════════════════════════════

Flow A – Meeting with missing info:
  User: "Remind me of a meeting tomorrow"
  You:  "Sure! What time is the meeting?" [DO NOT call create_plan yet]
  User: "3 PM"
  You:  "Got it. Where will it be held?"
  User: "At the office"
  You:  → call create_plan → "Scheduled ✅"

Flow B – Proactive greeting:
  User: "Good morning"
  You:  call list_plans(date_filter="today") → "Good morning! ☀️ Here's your day..."

Flow C – Personal fact (silent):
  User: "I work at Aramco in the IT department"
  You:  call store_fact({ fact: "Works at Aramco in the IT department", category: "work" })
        → "Great! How can I help you today?" [NO mention of storing]

Flow D – Second Brain fact:
  User: "My passport expires in June 2027"
  You:  call save_memory(...) + call store_fact(category="general")
        → "Got it! Noted 🧠"

Flow E – Using history:
  User: "What was I saying about the project?"
  You:  [check RECENT CONVERSATION HISTORY] → summarize what they said

Flow F – Timeline:
  User: "What did I do last week?"
  You:  call get_timeline(days_back=7) → summarize events

Flow G – Delete a plan:
  User: "Cancel my 3 PM meeting"
  You:  call list_plans(date_filter="today") → find plan → call delete_plan(plan_id)
        → "Done! Your 3 PM meeting has been cancelled."

REMEMBER: One tool call per action. No duplicate calls. No list_plans after writing.
`,

      tools: {

        // ── CREATE PLAN ──────────────────────────────────────────────────────
        create_plan: tool({
          description:
            "Create a calendar event, meeting, task, or shopping list. " +
            "Only call this when ALL required fields have been collected from the user.",
          parameters: z.object({
            title: z.string().describe("Short, clear title"),
            description: z.string().optional().describe("Details, agenda, or notes"),
            plan_date: z.string().describe(`Date (YYYY-MM-DD). Today = ${currentDate}`),
            plan_time: z.string().optional().describe("Start time (HH:MM:SS). Required for meetings."),
            end_time: z.string().optional().describe("End time (HH:MM:SS). Default: start + 1 hour."),
            is_all_day: z.boolean().optional().describe("True for birthdays, holidays, all-day events."),
            location: z.string().optional().describe("Physical address, 'Online', or 'TBD'"),
            attendees: z.array(z.string()).optional().describe("Names or emails of attendees"),
            category: z
              .enum(["task", "meeting", "grocery", "work", "personal", "health", "finance", "other"])
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
            return {
              success: true,
              message: `Scheduled "${input.title}" on ${input.plan_date}${input.plan_time ? " at " + input.plan_time.slice(0, 5) : ""}.`,
              plan: data,
            }
          },
        }),

        // ── UPDATE PLAN ──────────────────────────────────────────────────────
        update_plan: tool({
          description:
            "Update fields on an existing plan. Use list_plans first to get the plan_id.",
          parameters: z.object({
            plan_id: z.string().describe("UUID of the plan to update"),
            title: z.string().optional(),
            description: z.string().optional(),
            plan_date: z.string().optional(),
            plan_time: z.string().optional().describe("New start time (HH:MM:SS)"),
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

        // ── DELETE PLAN ──────────────────────────────────────────────────────
        delete_plan: tool({
          description: "Delete (cancel) a plan permanently. Use list_plans first to get the plan_id.",
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

        // ── LIST PLANS ───────────────────────────────────────────────────────
        list_plans: tool({
          description:
            "Retrieve the user's plans/schedule. Use for daily briefings, searching for a plan " +
            "before updating/deleting it, or when the user asks to see their plans.",
          parameters: z.object({
            date_filter: z.enum(["today", "tomorrow", "this_week", "upcoming", "all"]),
            category: z
              .enum(["task", "meeting", "grocery", "work", "personal", "health", "finance", "other", "all"])
              .optional().default("all"),
            status: z
              .enum(["pending", "done", "cancelled", "all"])
              .optional().default("pending"),
          }),
          execute: async ({ date_filter, category, status }) => {
            if (!user) return { success: false, message: "Login required", plans: [] }

            let query = supabase
              .from("plans")
              .select("*")
              .eq("user_id", user.id)
              .order("plan_date", { ascending: true })
              .order("plan_time", { ascending: true })

            if (date_filter === "today")
              query = query.eq("plan_date", currentDate)
            else if (date_filter === "tomorrow")
              query = query.eq("plan_date", addDays(1))
            else if (date_filter === "this_week")
              query = query.gte("plan_date", currentDate).lte("plan_date", addDays(7))
            else if (date_filter === "upcoming")
              query = query.gte("plan_date", currentDate)

            if (category && category !== "all") query = query.eq("category", category)
            if (status && status !== "all") query = query.eq("status", status)

            const { data, error } = await query
            if (error) return { success: false, message: error.message, plans: [] }

            return { success: true, plans: data ?? [], count: data?.length ?? 0, date_filter }
          },
        }),

        // ── SAVE MEMORY ──────────────────────────────────────────────────────
        save_memory: tool({
          description:
            "Save a note, fact, idea, or piece of info to the user's Second Brain. " +
            "Use proactively when the user shares info without any time/date context.",
          parameters: z.object({
            content: z.string().describe("The information to remember"),
            tags: z.array(z.string()).describe("2-5 descriptive tags"),
          }),
          execute: async ({ content, tags }) => {
            if (!user) return { success: false, message: "Login required" }

            const { data, error } = await supabase
              .from("memories")
              .insert({ user_id: user.id, content, tags })
              .select()
              .single()

            if (error) return { success: false, message: error.message }
            return { success: true, message: "Saved to your second brain.", memory: data }
          },
        }),

        // ── SEARCH MEMORIES ──────────────────────────────────────────────────
        search_memories: tool({
          description:
            "Search the user's Second Brain for saved notes or facts. " +
            "Use when the user asks 'do you remember', 'what did I say about', 'find my note on', etc.",
          parameters: z.object({
            query: z.string().describe("Keywords or topic to search for"),
            tag: z.string().optional().describe("Filter by a specific tag"),
          }),
          execute: async ({ query, tag }) => {
            if (!user) return { success: false, message: "Login required", memories: [] }

            let dbQuery = supabase
              .from("memories")
              .select("*")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(10)

            if (query) dbQuery = dbQuery.ilike("content", `%${query}%`)
            if (tag) dbQuery = dbQuery.contains("tags", [tag])

            const { data, error } = await dbQuery
            if (error) return { success: false, message: error.message, memories: [] }

            return { success: true, memories: data ?? [], count: data?.length ?? 0 }
          },
        }),

        // ── MARK DONE ────────────────────────────────────────────────────────
        mark_done: tool({
          description:
            "Mark a task or plan as completed. Use list_plans first to get the plan_id.",
          parameters: z.object({
            plan_id: z.string().describe("UUID of the plan to mark as done"),
          }),
          execute: async ({ plan_id }) => {
            if (!user) return { success: false, message: "Login required" }

            const { data, error } = await supabase
              .from("plans")
              .update({ status: "done" })
              .eq("id", plan_id)
              .eq("user_id", user.id)
              .select()
              .single()

            if (error) return { success: false, message: error.message }
            return { success: true, message: "Marked as done ✅", plan: data }
          },
        }),

        // ── STORE FACT ───────────────────────────────────────────────────────
        store_fact: tool({
          description:
            "Silently store a personal fact about the user extracted from conversation. " +
            "Call whenever the user reveals something personal. Do NOT announce this call.",
          parameters: z.object({
            fact: z.string().describe("The fact in plain language, e.g. 'Works at Aramco as a software engineer'"),
            category: z.enum([
              "work", "family", "health", "finance",
              "preference", "location", "education", "contact", "general",
            ]),
          }),
          execute: async ({ fact, category }) => {
            if (!user) return { success: false, message: "Login required" }

            // Check for near-duplicate before inserting
            const { data: existing } = await supabase
              .from("user_facts")
              .select("id")
              .eq("user_id", user.id)
              .eq("category", category)
              .ilike("fact", `${fact.slice(0, 40)}%`)
              .limit(1)

            if (existing && existing.length > 0) {
              await supabase
                .from("user_facts")
                .update({ fact })
                .eq("id", existing[0].id)
              return { success: true, message: "Fact updated." }
            }

            const { error } = await supabase
              .from("user_facts")
              .insert({ user_id: user.id, fact, category })

            if (error) return { success: false, message: error.message }
            return { success: true, message: "Fact stored." }
          },
        }),

        // ── GET TIMELINE ─────────────────────────────────────────────────────
        get_timeline: tool({
          description:
            "Retrieve the user's life timeline. Use when user asks 'what happened last week', " +
            "'summarize my month', 'what did I do recently', or any retrospective question.",
          parameters: z.object({
            days_back: z.number().min(1).max(365).default(7)
              .describe("How many days back to look. 7 = last week, 30 = last month."),
            source_type: z
              .enum(["plan_created", "plan_completed", "memory_saved",
                "file_uploaded", "voice_recorded", "fact_learned", "all"])
              .optional().default("all"),
          }),
          execute: async ({ days_back, source_type }) => {
            if (!user) return { success: false, message: "Login required", events: [] }

            let query = supabase
              .from("timeline_events")
              .select("title, description, event_date, source_type, importance")
              .eq("user_id", user.id)
              .gte("event_date", addDays(-days_back))
              .order("event_date", { ascending: false })
              .order("importance", { ascending: false })
              .limit(40)

            if (source_type && source_type !== "all") {
              query = query.eq("source_type", source_type)
            }

            const { data, error } = await query
            if (error) return { success: false, message: error.message, events: [] }

            return { success: true, events: data ?? [], count: data?.length ?? 0, days_back }
          },
        }),

        // ── GET MY FACTS ─────────────────────────────────────────────────────
        get_my_facts: tool({
          description:
            "Retrieve all stored facts about the user. Use when user asks " +
            "'what do you know about me' or similar questions.",
          parameters: z.object({
            category: z
              .enum(["work", "family", "health", "finance", "preference",
                "location", "education", "contact", "general", "all"])
              .optional().default("all"),
          }),
          execute: async ({ category }) => {
            if (!user) return { success: false, message: "Login required", facts: [] }

            let query = supabase
              .from("user_facts")
              .select("fact, category, created_at")
              .eq("user_id", user.id)
              .order("category")
              .order("created_at", { ascending: false })

            if (category && category !== "all") {
              query = query.eq("category", category)
            }

            const { data, error } = await query
            if (error) return { success: false, message: error.message, facts: [] }

            return { success: true, facts: data ?? [], count: data?.length ?? 0 }
          },
        }),

      }, // end tools
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error("[Thakirni] Chat API error:", error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}