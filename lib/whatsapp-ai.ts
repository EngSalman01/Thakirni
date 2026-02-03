import "server-only"
import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

// Intent schema for parsing WhatsApp messages
const IntentSchema = z.object({
  intent: z.enum([
    "create_reminder",
    "create_task",
    "add_grocery_item",
    "check_grocery_item",
    "show_grocery_list",
    "create_meeting",
    "list_tasks",
    "list_reminders",
    "help",
    "greeting",
    "unknown",
  ]),
  title: z.string().optional().describe("The title or name of the reminder/task/item"),
  description: z.string().optional().describe("Additional details"),
  datetime: z.string().optional().describe("ISO datetime string if time is mentioned"),
  recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  quantity: z.number().optional().describe("Quantity for grocery items"),
  location: z.string().optional().describe("Location for meetings"),
  confidence: z.number().min(0).max(1).describe("Confidence score"),
})

export type ParsedIntent = z.infer<typeof IntentSchema>

// Parse a WhatsApp message using AI
export async function parseWhatsAppMessage(
  message: string,
  userTimezone: string = "Asia/Riyadh"
): Promise<ParsedIntent> {
  const now = new Date()
  const currentDateStr = now.toLocaleDateString("ar-SA", { timeZone: userTimezone })
  const currentTimeStr = now.toLocaleTimeString("ar-SA", { timeZone: userTimezone, hour12: true })

  try {
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: IntentSchema,
      prompt: `You are an AI assistant that parses Arabic and English messages for a reminder/task app.
      
Current date: ${currentDateStr}
Current time: ${currentTimeStr}
Timezone: ${userTimezone}

Parse the following message and extract the user's intent:

"${message}"

Rules:
- If the message mentions a time (like "الساعة 5" or "at 5pm" or "غداً"), convert it to an ISO datetime string
- For Arabic time words: صباحاً = AM, مساءً = PM, ظهراً = noon, فجراً = dawn
- For relative times: غداً = tomorrow, بعد غد = day after tomorrow, الأسبوع القادم = next week
- Common intents:
  - "ذكرني", "remind me" = create_reminder
  - "مهمة", "task", "أضف مهمة" = create_task
  - "أضف", "شراء", "buy", "add" (grocery context) = add_grocery_item
  - "تم", "اشتريت", "bought", "done" = check_grocery_item
  - "قائمة", "list", "القائمة" = show_grocery_list
  - "اجتماع", "meeting" = create_meeting
  - "مساعدة", "help" = help
  - "مرحبا", "أهلا", "hi", "hello" = greeting
- If recurrence words are used (كل يوم, يومياً, أسبوعياً, daily, weekly), set recurrence
- Detect priority from words like مهم, عاجل, urgent, important
- If you can't determine the intent confidently, use "unknown"`,
    })

    return object
  } catch (error) {
    console.error("[WhatsApp AI] Parse error:", error)
    return {
      intent: "unknown",
      confidence: 0,
    }
  }
}

// Generate a natural response based on action taken
export async function generateResponse(
  action: string,
  details: Record<string, any>,
  language: "ar" | "en" = "ar"
): Promise<string> {
  try {
    const { object } = await generateObject({
      model: google("gemini-1.5-flash"),
      schema: z.object({
        response: z.string(),
      }),
      prompt: `Generate a brief, friendly ${language === "ar" ? "Arabic" : "English"} response for:
      
Action: ${action}
Details: ${JSON.stringify(details)}

Keep it short (1-2 sentences max). Use appropriate emojis. Be helpful and conversational.`,
    })

    return object.response
  } catch {
    // Fallback responses
    const fallbacks: Record<string, Record<string, string>> = {
      ar: {
        create_reminder: "✅ تم إنشاء التذكير!",
        create_task: "✅ تمت إضافة المهمة!",
        add_grocery_item: "✅ تمت الإضافة للقائمة!",
        check_grocery_item: "☑ تم!",
        create_meeting: "✅ تم حفظ الاجتماع!",
        default: "تم!",
      },
      en: {
        create_reminder: "✅ Reminder created!",
        create_task: "✅ Task added!",
        add_grocery_item: "✅ Added to list!",
        check_grocery_item: "☑ Done!",
        create_meeting: "✅ Meeting saved!",
        default: "Done!",
      },
    }

    return fallbacks[language][action] || fallbacks[language].default
  }
}
