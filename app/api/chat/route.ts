import { streamText, tool } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  const { messages } = await req.json()
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: `أنت مساعد ذكي اسمه "ذكرني" متخصص في مساعدة المستخدمين على:
1. إضافة خطط وتذكيرات مهمة (مثل: مواعيد، أحداث، ذكريات مهمة)
2. تنظيم ذكرياتهم وأحبائهم
3. إعداد تذكيرات دورية (يومية، أسبوعية، شهرية، سنوية)

عندما يطلب المستخدم إضافة خطة أو تذكير، استخدم أداة create_plan.
عندما يطلب المستخدم عرض خططه، استخدم أداة list_plans.

تحدث بالعربية بشكل ودود ومحترم. استخدم الإنجليزية إذا تحدث المستخدم بها.

You are Thakirni, an intelligent assistant helping users:
1. Add important plans and reminders (appointments, events, anniversaries)
2. Organize their memories and loved ones
3. Set up recurring reminders (daily, weekly, monthly, yearly)

When users ask to add a plan/reminder, use the create_plan tool.
When users ask to view their plans, use the list_plans tool.`,
    messages,
    tools: {
      create_plan: tool({
        description: "Create a new plan or reminder for the user. Use this when they want to remember something.",
        parameters: z.object({
          title: z.string().describe("Title of the plan/reminder in the user's language"),
          description: z.string().optional().describe("Optional description or details"),
          plan_date: z.string().describe("Date of the plan in ISO format (YYYY-MM-DD)"),
          plan_time: z.string().optional().describe("Time of the plan in HH:MM format, if specified"),
          recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).describe("How often to repeat this reminder"),
          category: z.enum(["anniversary", "appointment", "memory", "other"]).describe("Category of the plan"),
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
          category: z.enum(["all", "anniversary", "appointment", "memory", "other"]).optional().describe("Filter by category"),
          upcoming_only: z.boolean().describe("Show only upcoming plans"),
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
}
