import { streamText, tool } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    console.log("[v0] Chat API called with messages:", messages?.length)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log("[v0] User:", user?.id || "anonymous")

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are Thakirni, a friendly AI assistant for task and reminder management.

When users want to add a task, meeting, or reminder, use the create_plan tool.
When users want to see their tasks/plans, use the list_plans tool.

Always respond in the same language the user uses (Arabic or English).
Be helpful, concise, and friendly.`,
      messages,
      tools: {
        create_plan: tool({
          description: "Create a new plan, task, or reminder for the user",
          parameters: z.object({
            title: z.string().describe("Title of the task/reminder"),
            description: z.string().optional().describe("Optional details"),
            plan_date: z.string().describe("Date in YYYY-MM-DD format"),
            plan_time: z.string().optional().describe("Time in HH:MM format"),
            recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("none"),
            category: z.enum(["appointment", "task", "meeting", "grocery", "other"]).default("task"),
          }),
          execute: async ({ title, description, plan_date, plan_time, recurrence, category }) => {
            console.log("[v0] Creating plan:", title)
            if (!user) {
              return { success: false, message: "Please login first" }
            }
            
            const { data, error } = await supabase.from("plans").insert({
              user_id: user.id,
              title,
              description,
              plan_date,
              plan_time,
              recurrence,
              category,
            }).select().single()
            
            if (error) {
              console.log("[v0] Plan creation error:", error.message)
              return { success: false, message: error.message }
            }
            
            return { 
              success: true, 
              message: `Added "${title}" successfully!`,
              plan: data
            }
          },
        }),
        list_plans: tool({
          description: "List user's plans and tasks",
          parameters: z.object({
            category: z.enum(["all", "appointment", "task", "meeting", "grocery", "other"]).optional(),
            upcoming_only: z.boolean().default(true),
          }),
          execute: async ({ category, upcoming_only }) => {
            console.log("[v0] Listing plans")
            if (!user) {
              return { success: false, message: "Please login first", plans: [] }
            }
            
            let query = supabase
              .from("plans")
              .select("*")
              .eq("user_id", user.id)
              .order("plan_date", { ascending: true })
            
            if (category && category !== "all") {
              query = query.eq("category", category)
            }
            
            if (upcoming_only) {
              query = query.gte("plan_date", new Date().toISOString().split("T")[0])
            }
            
            const { data, error } = await query
            
            if (error) {
              return { success: false, message: error.message, plans: [] }
            }
            
            return { success: true, plans: data, count: data?.length || 0 }
          },
        }),
      },
      maxSteps: 5,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
