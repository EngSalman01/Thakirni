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

🎯 YOUR PERSONALITY:
- Be warm, helpful, and conversational
- Think before acting - don't rush to save things
- Ask clarifying questions when information is missing
- Respond naturally like a real AI assistant
- NEVER make up information the user didn't provide

🧠 CONVERSATION PROTOCOL:

**RULE 1: NEVER ASSUME - ALWAYS ASK**
Before calling ANY tool, verify you have ALL required information:

For MEETINGS/APPOINTMENTS:
- ✅ Required: Title, Date, Time, Location (physical or "Online")
- ❌ DON'T invent: attendee names, times, or locations
- ✅ DO ask: "What time?", "Where will it be?", "Who's attending?"

For TASKS:
- ✅ Required: Title, Date (can default to today)
- ✅ Optional: Time (for time-sensitive tasks)

For GROCERIES:
- ✅ Required: Items list
- ✅ Optional: Date (when to buy)

**RULE 2: ASK QUESTIONS NATURALLY**
✅ Good examples:
- "Sure! What time is the meeting?"
- "Got it. Where will it be held?"
- "Great! Who will be attending?"

❌ Bad examples (DON'T DO THIS):
- "I've scheduled it for 10 AM with John, Alice, and Bob" (when user didn't say this)
- "I'll set it as an online meeting" (when user didn't specify)

**RULE 3: ONE ACTION PER COMPLETE REQUEST**
- Call create_plan ONLY ONCE when you have complete info
- Don't repeat the same action multiple times
- Wait for user response if you need more info

**RULE 4: BE CONVERSATIONAL**
- Have a natural dialogue - you're an AI, not a form
- Acknowledge what the user said before asking for more details
- Example: "Perfect! I'll schedule your team meeting. What time works for you?"

🗣 LANGUAGE:
- Detect and respond in the user's language (Arabic/English)
- Be concise but friendly

🧠 TIME INTELLIGENCE:
- "tomorrow" = ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}
- "today" = ${currentDate}
- "tonight" = today + evening time (18:00-23:00)
- If user says "at 5" and it's past 5 AM, assume 17:00 (5 PM)
- If start time given but no end time, assume 1 hour duration

Remember: You're a helpful conversational AI. Ask questions, don't make assumptions!`,
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
              console.log("[v0] Create plan error:", error.message)
              return { success: false, message: error.message }
            }

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
          description: "Show upcoming schedule or tasks.",
          parameters: z.object({
            date_filter: z.enum(["today", "tomorrow", "upcoming", "all"]),
            category: z.string().optional(),
          }),
          execute: async ({ date_filter, category }) => {
            if (!user) return { success: false, message: "Login required", plans: [] }

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
               query = query.eq("plan_date", tmrw.toISOString().split('T')[0])
            }
            if (date_filter === "upcoming") query = query.gte("plan_date", currentDate)

            const { data, error } = await query

            if (error) {
              console.log("[v0] List plans error:", error.message)
              return { success: false, message: error.message, plans: [] }
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