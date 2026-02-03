import { streamText, tool } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: `أنت مساعد ذكي اسمه "ذكرني" متخصص في مساعدة المستخدمين على إدارة ذاكرتهم قصيرة المدى:
1. تنظيم المهام (Tasks)
2. قائمة البقالة (Groceries)  
3. الاجتماعات والمواعيد (Meetings)

عندما يطلب المستخدم إضافة مهمة أو غرض أو موعد، استخدم أداة create_plan.
عندما يطلب المستخدم عرض مهامه، استخدم أداة list_plans.

تحدث بالعربية إذا تحدث المستخدم بالعربية، وبالإنجليزية إذا تحدث بالإنجليزية.

You are Thakirni, an intelligent assistant helping users with Short-Term Memory management:
1. Task Management
2. Grocery Lists
3. Meetings & Appointments

When users ask to add a task, grocery item, or meeting, use the create_plan tool.
When users ask to view their items, use the list_plans tool.
Respond in the same language the user uses.`,
      messages,
      tools: {
        create_plan: tool({
          description: "Create a new plan or reminder for the user",
          parameters: z.object({
            title: z.string().describe("Title of the plan/reminder"),
            description: z.string().optional().describe("Optional description"),
            plan_date: z.string().describe("Date in YYYY-MM-DD format"),
            plan_time: z.string().optional().describe("Time in HH:MM format"),
            recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("none"),
            category: z.enum(["task", "grocery", "meeting", "appointment", "other"]).default("task"),
          }),
          execute: async ({ title, description, plan_date, plan_time, recurrence, category }) => {
            if (!user) {
              return { success: false, message: "يجب تسجيل الدخول أولاً / Please login first" }
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
              return { success: false, message: error.message }
            }
            
            return { 
              success: true, 
              message: `تم إضافة "${title}" بنجاح! / "${title}" added successfully!`,
              plan: data
            }
          },
        }),
        list_plans: tool({
          description: "List all plans and reminders for the user",
          parameters: z.object({
            category: z.enum(["all", "task", "grocery", "meeting", "appointment", "other"]).optional(),
            upcoming_only: z.boolean().default(true),
          }),
          execute: async ({ category, upcoming_only }) => {
            if (!user) {
              return { success: false, message: "يجب تسجيل الدخول أولاً / Please login first", plans: [] }
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
            
            return { 
              success: true, 
              plans: data,
              count: data?.length || 0
            }
          },
        }),
      },
      maxSteps: 5,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
