import { streamText, tool } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Polyfill for convertToCoreMessages if missing from SDK
// This converts UI messages (from useChat) to Core messages (for streamText)
function convertToCoreMessages(messages: any[]) {
  const coreMessages: any[] = [];

  for (const message of messages) {
    if (message.role === 'user') {
      coreMessages.push({
        role: 'user',
        content: message.content,
      });
    } else if (message.role === 'assistant') {
      const content = [];
      if (message.content) {
        content.push({ type: 'text', text: message.content });
      }
      
      // Handle tool calls
      if (message.toolInvocations) {
        for (const toolInvocation of message.toolInvocations) {
           // In Core API, the assistant message contains the call
           // We include it if it's in 'call' state or 'result' state (history)
           content.push({ 
             type: 'tool-call', 
             toolCallId: toolInvocation.toolCallId,
             toolName: toolInvocation.toolName,
             args: toolInvocation.args
           });
        }
      }
      
      coreMessages.push({
        role: 'assistant',
        content: content,
      });
      
      // Handle tool results as separate messages following the assistant message
      const toolResults = [];
      if (message.toolInvocations) {
        for (const toolInvocation of message.toolInvocations) {
           if ('result' in toolInvocation) {
             toolResults.push({
               type: 'tool-result',
               toolCallId: toolInvocation.toolCallId,
               toolName: toolInvocation.toolName,
               result: toolInvocation.result
             });
           }
        }
      }
      
      if (toolResults.length > 0) {
        coreMessages.push({
          role: 'tool',
          content: toolResults
        });
      }
      
    } else if (message.role === 'tool') {
       // If UI sent 'tool' role explicitly (rare in useChat default but possible)
       coreMessages.push({
         role: 'tool',
         content: message.content
       })
    } else if (message.role === 'system') {
      coreMessages.push({
        role: 'system',
        content: message.content
      })
    }
  }
  return coreMessages;
}

export async function POST(req: Request) {
  console.log("Chat API called")
  const { messages } = await req.json()
  console.log("Received messages count:", messages?.length)

  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  console.log("User authenticated:", !!user)


  const result = streamText({
    model: google("gemini-1.5-flash"),
    system: `أنت مساعد ذكي اسمه "ذكرني" متخصص في مساعدة المستخدمين على إدارة ذاكرتهم قصيرة المدى:
1. تنظيم المهام (Tasks)
2. قائمة البقالة (Groceries)
3. الاجتماعات والمواعيد (Meetings)

عندما يطلب المستخدم إضافة مهمة أو غرض أو موعد، استخدم أداة create_plan.
عندما يطلب المستخدم عرض مهامه، استخدم أداة list_plans.

تحدث بالعربية بشكل عملي ومختصر.

You are Thakirni, an intelligent assistant helping users with Short-Term Memory management:
1. Task Management
2. Grocery Lists
3. Meetings & Appointments

When users ask to add a task, grocery item, or meeting, use the create_plan tool.
When users ask to view their items, use the list_plans tool.`,
    messages: convertToCoreMessages(messages),
    tools: {
      create_plan: tool({
        description: "Create a new plan or reminder for the user. Use this when they want to remember something.",
        inputSchema: z.object({
          title: z.string().describe("Title of the plan/reminder in the user's language"),
          description: z.string().nullable().describe("Optional description or details"),
          plan_date: z.string().describe("Date of the plan in ISO format (YYYY-MM-DD)"),
          plan_time: z.string().nullable().describe("Time of the plan in HH:MM format, if specified"),
          recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).describe("How often to repeat this reminder"),
          category: z.enum(["task", "grocery", "meeting", "other"]).describe("Category of the plan"),
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
        inputSchema: z.object({
          category: z.enum(["all", "task", "grocery", "meeting", "other"]).nullable().describe("Filter by category"),
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
    }
  })

  return result.toTextStreamResponse()
}
