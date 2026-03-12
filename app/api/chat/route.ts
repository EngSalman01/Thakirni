import { streamText, tool, convertToCoreMessages } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// ─── Time Helpers ────────────────────────────────────────────────────────────

function getSaudiTime() {
  const now = new Date()
  const tz = "Asia/Riyadh"
  const currentDate = now.toLocaleDateString("en-CA", { timeZone: tz })          // YYYY-MM-DD
  const currentTime = now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }).slice(0, 5) // HH:MM
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

    // Pre-resolve relative day labels so the LLM never has to guess
    const dayMap = {
      today: currentDate,
      tomorrow: addDays(1),
      yesterday: addDays(-1),
      "day after tomorrow": addDays(2),
    }

    // Determine time-of-day greeting hint
    const timeOfDay =
      currentHour < 12 ? "morning" :
      currentHour < 17 ? "afternoon" :
      currentHour < 21 ? "evening" : "night"

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      maxSteps: 10,
      messages: convertToCoreMessages(messages),

      system: `
You are **Thakirni (ذكرني)** — a warm, intelligent personal assistant that acts as the user's second brain.
Your personality: friendly, proactive, organised, like a trusted chief-of-staff who remembers everything.

━━━━━━━━━━━━━━━━━━━━━━━━
🕒 CURRENT CONTEXT (Saudi Arabia / Riyadh)
  Date : \${currentDate} (\${currentDayName})
  Time : \${currentTime}  (\${timeOfDay})
  Tomorrow : \${dayMap.tomorrow}
━━━━━━━━━━━━━━━━━━━━━━━━

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
   - "next week" → \${addDays(7)}
   - "this weekend" → \${addDays(6 - new Date(currentDate).getDay())} (nearest Saturday)

4. **SECOND BRAIN MODE**
   If the user shares a fact, idea, quote, or piece of info with no time attached,
   call save_memory automatically — don't ask, just do it and confirm.
   Examples: "My car plate is XYZ", "Ahmed's birthday is in March", "My wifi password is 1234".

5. **LANGUAGE MIRRORING**
   Always reply in the same language the user used. If Arabic, reply in Arabic.
   Switch fluidly mid-conversation.

6. **EMOTIONAL INTELLIGENCE**
   If user seems stressed (lots of tasks, tight deadlines), acknowledge it with empathy
   before diving into logistics.

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

════════════════════════════════════════
EXAMPLE CONVERSATION FLOWS
════════════════════════════════════════

Flow A – Meeting with missing info:
  User: "Remind me of a meeting tomorrow"
  You:  "Sure! What time is the meeting?" [DO NOT call create_plan]
  User: "3 PM"
  You:  "Got it — 3 PM tomorrow. Where will it be held?" [still don't call]
  User: "At the office"
  You:  "Perfect! I'll schedule your meeting tomorrow at 3 PM at the office." → call create_plan

Flow B – Proactive greeting:
  User: "Good morning"
  You:  call list_plans(date_filter="today") → "Good morning! ☀️ Here's your day: ..."

Flow C – Second Brain fact:
  User: "My passport expires in June 2027"
  You:  call save_memory({content: "Passport expires June 2027", tags: ["passport","documents","expiry"]})
        → "Got it! I've saved that to your second brain 🧠"

Flow D – Delete a plan:
  User: "Cancel my 3 PM meeting"
  You:  call list_plans(date_filter="today") → find the plan → call delete_plan(plan_id)
        → "Done! Your 3 PM meeting has been cancelled."

Flow E – Update a plan:
  User: "Move my 3 PM meeting to 5 PM"
  You:  call list_plans(date_filter="today") → find the plan →
        call update_plan({plan_id, plan_time: "17:00:00"})
        → "Done! I've moved your meeting to 5 PM ✅"

Flow F – Recurring reminder:
  User: "Remind me every Monday to send the weekly report"
  You:  call create_plan with recurrence="weekly", plan_date=next Monday, category="work"

REMEMBER: One tool call per action. No duplicate calls. No list_plans after writing.
`,
      tools: {

        // ── CREATE ──────────────────────────────────────────────────────────
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
            recurrence: z
              .enum(["none", "daily", "weekly", "monthly", "yearly"])
              .optional()
              .default("none"),
          }),
          execute: async (input) => {
            if (!user) return { success: false, message: "Login required" }

            // Auto-compute end_time if not provided
            let endTime = input.end_time
            if (input.plan_time && !endTime) {
              const [h, m] = input.plan_time.split(":").map(Number)
              const endH = (h + 1) % 24
              endTime = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
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

        // ── UPDATE ──────────────────────────────────────────────────────────
        update_plan: tool({
          description:
            "Update fields on an existing plan (reschedule, rename, change location, etc.). " +
            "Use list_plans first to get the plan_id.",
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
            // Remove undefined keys to avoid overwriting with null
            const updates = Object.fromEntries(
              Object.entries(fields).filter(([, v]) => v !== undefined)
            )

            const { data, error } = await supabase
              .from("plans")
              .update(updates)
              .eq("id", plan_id)
              .eq("user_id", user.id) // security: only own plans
              .select()
              .single()

            if (error) return { success: false, message: error.message }
            return { success: true, message: "Plan updated.", plan: data }
          },
        }),

        // ── DELETE ──────────────────────────────────────────────────────────
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

        // ── LIST PLANS ──────────────────────────────────────────────────────
        list_plans: tool({
          description:
            "Retrieve the user's plans/schedule. Use for daily briefings, searching for a plan " +
            "before updating/deleting it, or when the user asks to see their plans.",
          parameters: z.object({
            date_filter: z
              .enum(["today", "tomorrow", "this_week", "upcoming", "all"])
              .describe("Time range for the query"),
            category: z
              .enum(["task", "meeting", "grocery", "work", "personal", "health", "finance", "other", "all"])
              .optional()
              .default("all"),
            status: z
              .enum(["pending", "done", "cancelled", "all"])
              .optional()
              .default("pending"),
          }),
          execute: async ({ date_filter, category, status }) => {
            if (!user) return { success: false, message: "Login required", plans: [] }

            let query = supabase
              .from("plans")
              .select("*")
              .eq("user_id", user.id)
              .order("plan_date", { ascending: true })
              .order("plan_time", { ascending: true })

            // Date filter
            if (date_filter === "today") {
              query = query.eq("plan_date", currentDate)
            } else if (date_filter === "tomorrow") {
              query = query.eq("plan_date", addDays(1))
            } else if (date_filter === "this_week") {
              query = query.gte("plan_date", currentDate).lte("plan_date", addDays(7))
            } else if (date_filter === "upcoming") {
              query = query.gte("plan_date", currentDate)
            }

            // Category filter
            if (category && category !== "all") {
              query = query.eq("category", category)
            }

            // Status filter
            if (status && status !== "all") {
              query = query.eq("status", status)
            }

            const { data, error } = await query
            if (error) return { success: false, message: error.message, plans: [] }

            return {
              success: true,
              plans: data ?? [],
              count: data?.length ?? 0,
              date_filter,
            }
          },
        }),

        // ── SAVE MEMORY ─────────────────────────────────────────────────────
        save_memory: tool({
          description:
            "Save a note, fact, idea, or piece of info to the user's Second Brain. " +
            "Use proactively when the user shares personal facts without any time/date context. " +
            "Auto-generate relevant tags.",
          parameters: z.object({
            content: z.string().describe("The information to remember"),
            tags: z.array(z.string()).describe("2-5 descriptive tags for easy retrieval"),
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

        // ── SEARCH MEMORIES ─────────────────────────────────────────────────
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

            // Full-text search on content
            if (query) {
              dbQuery = dbQuery.ilike("content", `%${query}%`)
            }

            // Tag filter — Supabase array contains
            if (tag) {
              dbQuery = dbQuery.contains("tags", [tag])
            }

            const { data, error } = await dbQuery
            if (error) return { success: false, message: error.message, memories: [] }

            return {
              success: true,
              memories: data ?? [],
              count: data?.length ?? 0,
            }
          },
        }),

        // ── MARK DONE ───────────────────────────────────────────────────────
        mark_done: tool({
          description:
            "Mark a task or plan as completed. Use when user says 'done', 'finished', 'completed', 'check off', etc. " +
            "Use list_plans first to get the plan_id if you don't already have it.",
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
