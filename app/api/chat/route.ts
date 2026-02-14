import { streamText, tool, convertToCoreMessages } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    console.log("[v0] Chat API called with", messages?.length, "messages")

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    console.log("[v0] User:", user?.id ?? "not authenticated")

    // 1. Setup Time Context (Saudi Arabia)
    const now = new Date()
    const options = { timeZone: "Asia/Riyadh", hour12: false }
    const currentDate = now.toLocaleDateString("en-CA", { ...options }) // YYYY-MM-DD
    const currentTime = now.toLocaleTimeString("en-GB", { ...options }) // HH:MM
    const currentDayName = now.toLocaleDateString("en-US", { weekday: "long" })

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      
      // Allow multi-step conversations
      maxSteps: 10,
      
      messages: convertToCoreMessages(messages),

      // 2. Conversational AI System Prompt
      system: `You are Thakirni (ذكرني), a friendly and intelligent personal assistant.

🕒 CURRENT CONTEXT (Saudi Arabia Time):
- Date: ${currentDate} (${currentDayName})
- Time: ${currentTime}

⚠️ CRITICAL RULE - READ THIS FIRST ⚠️

**YOU MUST NEVER CALL create_plan UNTIL YOU HAVE *ALL* REQUIRED INFORMATION**

If the user says "remind me for a meeting tomorrow", you DO NOT have enough information yet!
You need: Time, Location, and optionally Attendees.

DO THIS:
1. Acknowledge the user's request
2. Ask for ONE missing piece of information at a time
3. ONLY call create_plan when you have EVERYTHING

DON'T DO THIS:
❌ Create a plan, then ask for time
❌ Create another plan when they tell you the time
❌ Create multiple plans during one conversation
❌ Call create_plan before you have complete information
❌ Call list_plans multiple times in the same response

🎯 REQUIRED INFORMATION CHECKLIST:

For MEETINGS/APPOINTMENTS - ALL required:
- ✅ Title
- ✅ Date
- ✅ Time (HH:MM)
- ✅ Location (physical address OR "Online")
- Optional: Attendees, description

For TASKS - Required:
- ✅ Title
- ✅ Date (can default to today)
- Optional: Time, priority

For GROCERIES - Required:
- ✅ Items list
- Optional: Date

🧠 CONVERSATION FLOW:

Step 1: User says "Remind me for a meeting tomorrow"
→ You think: I need time and location
→ You respond: "Sure! What time is the meeting?"
→ **DO NOT CALL create_plan YET!**

Step 2: User says "9 AM"
→ You think: I still need location
→ You respond: "Got it, 9 AM. Where will the meeting be held?"
→ **DO NOT CALL create_plan YET!**

Step 3: User says "Online"
→ You think: Now I have everything (title=meeting, date=tomorrow, time=9AM, location=Online)
→ You respond: "Perfect! I've scheduled your meeting tomorrow at 9 AM online."
→ **NOW call create_plan ONCE with all the information**
→ **DO NOT call list_plans after creating - just confirm what you created!**

🗣 RESPONSE STYLE:
- Be friendly and conversational
- Ask ONE question at a time
- Acknowledge what the user told you before asking for more
- Detect and respond in the user's language (Arabic/English)
- After creating a plan, DON'T call list_plans - just confirm the creation

🧠 TIME INTELLIGENCE:
- "tomorrow" = ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- "today" = ${currentDate}
- "tonight" = today + evening time (18:00-23:00)
- If user says "at 5" and it's past 5 AM, assume 17:00 (5 PM)
- If start time given but no end time, assume 1 hour duration

REMEMBER: You are having a CONVERSATION. Gather all information FIRST, then create the plan ONCE. Don't verify by calling list_plans right after!`,
      tools: {
        create_plan: tool({
          description: "Schedule a calendar event, task, or meeting.",
          parameters: z.object({
            title: z.string().describe("Title of the event"),
            description: z.string().optional().describe("Details/Agenda"),
            
            // Date & Time
            plan_date: z.string().describe(`Date (YYYY-MM-DD). Default to ${currentDate}.`),
            plan_time: z.string().optional().describe("Start time (HH:MM:SS). REQUIRED for meetings."),
            end_time: z.string().optional().describe("End time (HH:MM:SS). Default +1 hour if missing."),
            is_all_day: z.boolean().optional().describe("True for birthdays/holidays."),
            
            // Location & People
            location: z.string().optional().describe("Physical location or 'Online'."),
            attendees: z.array(z.string()).optional().describe("List of people names."),
            
            // Metadata
            category: z.enum(['task', 'meeting', 'grocery', 'work', 'personal', 'other'])
              .describe("Auto-categorize based on context."),
            priority: z.enum(['low', 'medium', 'high']).optional().describe("Importance level."),
            recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional().describe("Recurrence pattern"),
          }),
          execute: async (input) => {
            if (!user) return { success: false, message: "يجب تسجيل الدخول أولاً" }
            
            console.log("[v0] Creating plan:", JSON.stringify(input, null, 2))
            console.log("[v0] User ID:", user.id)
            
            const { data, error } = await supabase
              .from("plans")
              .insert({
                user_id: user.id,
                title: input.title,
                description: input.description,
                plan_date: input.plan_date,
                plan_time: input.plan_time,
                end_time: input.end_time,
                location: input.location,
                attendees: input.attendees,
                category: input.category || 'task',
                priority: input.priority || 'medium',
                recurrence: input.recurrence || 'none',
                is_all_day: input.is_all_day || false,
                status: 'pending'
              })
              .select()
              .single()

            if (error) {
              console.error("[v0] Create plan error:", error)
              return { success: false, message: error.message }
            }

            console.log("[v0] Plan created successfully:", data)
            return {
              success: true,
              message: `Scheduled "${input.title}" on ${input.plan_date} ${input.plan_time ? 'at ' + input.plan_time : ''}.`,
              plan: data,
            }
          },
        }),

        save_memory: tool({
          description: "Save a note, idea, or info with NO specific time (Second Brain).",
          parameters: z.object({
            content: z.string().describe("The text content"),
            tags: z.array(z.string()).describe("Tags for filtering"),
          }),
          execute: async ({ content, tags }) => {
            if (!user) return { success: false, message: "يجب تسجيل الدخول أولاً" }

            const { data, error } = await supabase
              .from("memories")
              .insert({
                user_id: user.id,
                content,
                tags
              })
              .select()
              .single()

            if (error) {
                console.log("[v0] Save memory error:", error.message)
                return { success: false, message: error.message }
            }
            return { success: true, message: "Memory saved!", memory: data }
          },
        }),

        list_plans: tool({
          description: "Show upcoming schedule or tasks. Use ONLY when user explicitly asks to see their plans.",
          parameters: z.object({
            date_filter: z.enum(["today", "tomorrow", "upcoming", "all"]),
            category: z.string().optional(),
          }),
          execute: async ({ date_filter, category }) => {
            if (!user) return { success: false, message: "Login required", plans: [] }

            console.log("[v0] Listing plans - Filter:", date_filter, "Category:", category, "User:", user.id)

            let query = supabase
              .from("plans")
              .select("*")
              .eq("user_id", user.id)
              .order("plan_date", { ascending: true })

            if (category && category !== "all") {
                query = query.eq("category", category)
            }

            if (date_filter === "today") query = query.eq("plan_date", currentDate)
            if (date_filter === "tomorrow") {
               const tmrw = new Date(now)
               tmrw.setDate(tmrw.getDate() + 1)
               const tomorrowDate = tmrw.toISOString().split('T')[0]
               console.log("[v0] Tomorrow date:", tomorrowDate)
               query = query.eq("plan_date", tomorrowDate)
            }
            if (date_filter === "upcoming") query = query.gte("plan_date", currentDate)

            const { data, error } = await query

            if (error) {
              console.error("[v0] List plans error:", error)
              return { success: false, message: error.message, plans: [] }
            }

            console.log("[v0] Plans found:", data?.length || 0)
            if (data && data.length > 0) {
              console.log("[v0] First plan:", data[0])
            }

            return {
              success: true,
              plans: data,
              count: data?.length || 0,
            }
          },
        }),
      },
    })

    console.log("[v0] Stream created successfully")
    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error("[v0] Chat API error:", error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}