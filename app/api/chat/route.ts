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
    // This helps the AI understand "Tomorrow" or "Tonight" relative to KSA.
    const now = new Date()
    const options = { timeZone: "Asia/Riyadh", hour12: false }
    const currentDate = now.toLocaleDateString("en-CA", { ...options }) // YYYY-MM-DD
    const currentTime = now.toLocaleTimeString("en-GB", { ...options }) // HH:MM
    const currentDayName = now.toLocaleDateString("en-US", { weekday: "long" })

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      
      // 2. CRITICAL: Increase Max Steps
      // Allows the AI to: Ask Question -> User Answers -> AI Saves (Loop)
      maxSteps: 10,
      
      // Convert messages to standard format to prevent errors
      messages: convertToCoreMessages(messages),

      // 3. THE SMART BRAIN (System Prompt)
      system: `You are Thakirni (ذكرني), a smart and proactive Assistant.
    
    🕒 CURRENT CONTEXT (KSA Time):
    - Date: ${currentDate} (${currentDayName})
    - Time: ${currentTime}
    
    🛑 THE "STOP & ASK" PROTOCOL:
    Before calling 'create_plan', you MUST classify the request:
    
    TYPE A: "Fuzzy Tasks" (e.g., "Buy milk", "Fix the door")
    -> ACTION: You can save these immediately with just a date (default to Today). Time is optional.
    
    TYPE B: "Hard Events" (e.g., "Meeting", "Dentist", "Flight", "Interview")
    -> ACTION: You CANNOT save these without a TIME and LOCATION.
       1. If the user didn't say the time, ASK: "What time is the meeting?"
       2. If the user didn't say the location, ASK: "Where is it?" (or "Is it online?")
       3. ONLY when you have the answers, call the 'create_plan' tool.
    
    🧠 INTELLIGENT DEFAULTS:
    - If user says "At 5", look at current time. If 5 AM is passed, assume 17:00 (5 PM).
    - If start time is given but no end time, assume duration is 1 hour.
    
    🗣 LANGUAGE:
    - Reply in the same language as the user (Arabic/English).
    `,
      tools: {
        create_plan: tool({
          description: "Schedule a calendar event, task, or meeting.",
          parameters: z.object({
            title: z.string().describe("Title of the event"),
            description: z.string().optional().describe("Details/Agenda"),
            
            // Timing (Google Calendar Style)
            start_datetime: z.string().describe(`ISO 8601 Timestamp (e.g., ${now.toISOString()}). REQUIRED.`),
            end_datetime: z.string().optional().describe("ISO 8601 Timestamp. Default +1 hour if missing."),
            is_all_day: z.boolean().optional().describe("True for birthdays/holidays."),
            
            // Location & People
            location: z.string().optional().describe("Physical location or 'Online'."),
            attendees: z.array(z.string()).optional().describe("List of emails/names."),
            
            // Metadata
            category: z.enum(['task', 'meeting', 'grocery', 'work', 'personal', 'other'])
              .describe("Auto-categorize based on context."),
            recurrence_rule: z.string().optional().describe("RRULE string for recurring events (e.g., 'FREQ=WEEKLY')."),
            color_code: z.string().optional().describe("Hex color code based on priority/category."),
            reminder_minutes: z.number().optional().describe("Minutes before event to remind."),
          }),
          execute: async (input) => {
            if (!user) return { success: false, message: "يجب تسجيل الدخول أولاً" }
            
            const { data, error } = await supabase
              .from("plans")
              .insert({
                user_id: user.id,
                title: input.title,
                description: input.description,
                start_datetime: input.start_datetime,
                end_datetime: input.end_datetime,
                is_all_day: input.is_all_day || false,
                location: input.location,
                participants: input.attendees,
                category: input.category || 'task',
                recurrence_rule: input.recurrence_rule,
                color_code: input.color_code || '#3B82F6',
                reminder_minutes: input.reminder_minutes,
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
              message: `Scheduled "${input.title}" at ${new Date(input.start_datetime).toLocaleString()}.`,
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
              .order("start_datetime", { ascending: true })

            if (category && category !== "all") {
                query = query.eq("category", category)
            }

            if (date_filter === "today") {
                const todayStart = new Date(now).toISOString().split('T')[0]
                query = query.gte("start_datetime", `${todayStart}T00:00:00`)
                           .lte("start_datetime", `${todayStart}T23:59:59`)
            }
            if (date_filter === "tomorrow") {
               const tmrw = new Date(now)
               tmrw.setDate(tmrw.getDate() + 1)
               const tmrwStart = tmrw.toISOString().split('T')[0]
               query = query.gte("start_datetime", `${tmrwStart}T00:00:00`)
                          .lte("start_datetime", `${tmrwStart}T23:59:59`)
            }
            if (date_filter === "upcoming") query = query.gte("start_datetime", now.toISOString())

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