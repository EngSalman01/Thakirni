import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  verifyWebhook,
  parseWebhookPayload,
  sendTextMessage,
  sendGroceryList,
  MESSAGES,
} from "@/lib/whatsapp"
import { parseWhatsAppMessage, generateResponse } from "@/lib/whatsapp-ai"

// Create admin supabase client inside handler


// GET: Webhook verification for Meta
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const result = verifyWebhook(mode, token, challenge)

  if (result) {
    return new NextResponse(result, { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

// POST: Handle incoming messages
export async function POST(req: NextRequest) {
  // Create admin supabase client for webhook (no user context)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await req.json()
    const message = parseWebhookPayload(body)

    if (!message) {
      return NextResponse.json({ status: "no_message" })
    }

    // Log incoming message
    await supabase.from("whatsapp_messages").insert({
      phone_number: message.from,
      direction: "incoming",
      message_type: "text",
      content: message.text?.body || JSON.stringify(message.interactive),
      whatsapp_message_id: message.id,
    })

    // Find user by phone number
    const { data: connection } = await supabase
      .from("whatsapp_connections")
      .select("user_id, phone_number")
      .eq("phone_number", message.from)
      .eq("is_verified", true)
      .single()

    const userId = connection?.user_id

    // Handle text messages
    if (message.type === "text" && message.text?.body) {
      const text = message.text.body.trim().toLowerCase()

      // Check for basic commands first
      if (["مرحبا", "أهلا", "hi", "hello", "start"].includes(text)) {
        await sendTextMessage(message.from, MESSAGES.ar.welcome)
        return NextResponse.json({ status: "sent_welcome" })
      }

      if (["مساعدة", "help", "?"].includes(text)) {
        await sendTextMessage(message.from, MESSAGES.ar.help)
        return NextResponse.json({ status: "sent_help" })
      }

      // Parse message with AI
      const parsed = await parseWhatsAppMessage(message.text.body)

      switch (parsed.intent) {
        case "create_reminder":
          if (userId && parsed.title) {
            const reminderTime = parsed.datetime ? new Date(parsed.datetime) : new Date(Date.now() + 3600000)
            
            await supabase.from("reminders").insert({
              user_id: userId,
              title: parsed.title,
              description: parsed.description,
              reminder_type: parsed.recurrence || "one_time",
              reminder_time: reminderTime.toISOString(),
              next_reminder_at: reminderTime.toISOString(),
              whatsapp_number: message.from,
            })

            const response = await generateResponse("create_reminder", {
              title: parsed.title,
              time: reminderTime.toLocaleString("ar-SA"),
            })
            await sendTextMessage(message.from, response)
          } else {
            await sendTextMessage(message.from, "يرجى تحديد ما تريد التذكير به والوقت.")
          }
          break

        case "create_task":
          if (userId && parsed.title) {
            await supabase.from("tasks").insert({
              user_id: userId,
              title: parsed.title,
              description: parsed.description,
              due_date: parsed.datetime,
              priority: parsed.priority || "medium",
              whatsapp_reminder: true,
            })

            const response = await generateResponse("create_task", { title: parsed.title })
            await sendTextMessage(message.from, response)
          }
          break

        case "add_grocery_item":
          if (userId && parsed.title) {
            // Get or create default grocery list
            let { data: list } = await supabase
              .from("grocery_lists")
              .select("id")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            if (!list) {
              const { data: newList } = await supabase
                .from("grocery_lists")
                .insert({ user_id: userId, name: "قائمة التسوق" })
                .select("id")
                .single()
              list = newList
            }

            if (list) {
              await supabase.from("grocery_items").insert({
                list_id: list.id,
                name: parsed.title,
                quantity: parsed.quantity || 1,
                added_via: "whatsapp",
              })

              await sendTextMessage(message.from, MESSAGES.ar.itemAdded(parsed.title))
            }
          }
          break

        case "check_grocery_item":
          if (userId && parsed.title) {
            const { data: list } = await supabase
              .from("grocery_lists")
              .select("id")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            if (list) {
              await supabase
                .from("grocery_items")
                .update({ is_checked: true })
                .eq("list_id", list.id)
                .ilike("name", `%${parsed.title}%`)

              await sendTextMessage(message.from, MESSAGES.ar.itemChecked(parsed.title))
            }
          }
          break

        case "show_grocery_list":
          if (userId) {
            const { data: list } = await supabase
              .from("grocery_lists")
              .select("id, name")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            if (list) {
              const { data: items } = await supabase
                .from("grocery_items")
                .select("name, quantity, unit, is_checked")
                .eq("list_id", list.id)
                .order("is_checked", { ascending: true })

              await sendGroceryList(
                message.from,
                list.name,
                (items || []).map((i) => ({
                  name: i.name,
                  quantity: i.quantity,
                  unit: i.unit,
                  checked: i.is_checked,
                }))
              )
            } else {
              await sendTextMessage(message.from, "لا توجد قائمة تسوق. أرسل اسم منتج لإنشاء قائمة جديدة.")
            }
          }
          break

        case "create_meeting":
          if (userId && parsed.title && parsed.datetime) {
            await supabase.from("meetings").insert({
              user_id: userId,
              title: parsed.title,
              description: parsed.description,
              location: parsed.location,
              start_time: parsed.datetime,
              whatsapp_reminder: true,
            })

            const response = await generateResponse("create_meeting", {
              title: parsed.title,
              time: new Date(parsed.datetime).toLocaleString("ar-SA"),
            })
            await sendTextMessage(message.from, response)
          }
          break

        case "greeting":
          await sendTextMessage(message.from, MESSAGES.ar.welcome)
          break

        case "help":
          await sendTextMessage(message.from, MESSAGES.ar.help)
          break

        default:
          // If user not connected, prompt to connect
          if (!userId) {
            await sendTextMessage(
              message.from,
              "مرحباً! يبدو أن رقمك غير مربوط بحساب ذكرني.\n\nسجل دخولك في التطبيق واربط رقم الواتساب من الإعدادات للاستفادة من جميع الميزات."
            )
          } else {
            await sendTextMessage(message.from, MESSAGES.ar.notUnderstood)
          }
      }

      // Log outgoing message action
      await supabase.from("whatsapp_messages").insert({
        user_id: userId,
        phone_number: message.from,
        direction: "outgoing",
        message_type: "text",
        content: `[Response to: ${parsed.intent}]`,
        parsed_intent: parsed.intent,
      })
    }

    // Handle interactive button responses
    if (message.type === "interactive" && message.interactive) {
      const buttonId = message.interactive.button_reply?.id || message.interactive.list_reply?.id

      if (buttonId) {
        // Handle reminder actions
        if (buttonId.startsWith("done_")) {
          const reminderId = buttonId.replace("done_", "")
          await supabase
            .from("reminders")
            .update({ is_active: false })
            .eq("id", reminderId)
          await sendTextMessage(message.from, "✅ تم إتمام التذكير!")
        } else if (buttonId.startsWith("snooze_")) {
          const reminderId = buttonId.replace("snooze_", "")
          const snoozeTime = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
          await supabase
            .from("reminders")
            .update({ next_reminder_at: snoozeTime.toISOString() })
            .eq("id", reminderId)
          await sendTextMessage(message.from, "⏰ تم تأجيل التذكير 15 دقيقة")
        }

        // Handle task actions
        if (buttonId.startsWith("task_done_")) {
          const taskId = buttonId.replace("task_done_", "")
          await supabase
            .from("tasks")
            .update({ status: "completed" })
            .eq("id", taskId)
          await sendTextMessage(message.from, "✅ تم إنجاز المهمة!")
        } else if (buttonId.startsWith("task_snooze_")) {
          const taskId = buttonId.replace("task_snooze_", "")
          const snoozeDue = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
          await supabase
            .from("tasks")
            .update({ due_date: snoozeDue.toISOString() })
            .eq("id", taskId)
          await sendTextMessage(message.from, "⏰ تم تأجيل المهمة ساعة واحدة")
        }

        // Handle meeting actions
        if (buttonId.startsWith("meeting_confirm_")) {
          await sendTextMessage(message.from, "✅ تم تأكيد حضورك!")
        } else if (buttonId.startsWith("meeting_cancel_")) {
          const meetingId = buttonId.replace("meeting_cancel_", "")
          await supabase.from("meetings").delete().eq("id", meetingId)
          await sendTextMessage(message.from, "❌ تم إلغاء الاجتماع")
        }
      }
    }

    return NextResponse.json({ status: "processed" })
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
