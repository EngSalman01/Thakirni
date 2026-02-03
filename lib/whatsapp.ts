import "server-only"

// WhatsApp Cloud API configuration
const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0"
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "thakirni_verify_token"

export interface WhatsAppMessage {
  to: string
  type: "text" | "template" | "interactive"
  text?: { body: string }
  template?: {
    name: string
    language: { code: string }
    components?: Array<{
      type: string
      parameters: Array<{ type: string; text?: string }>
    }>
  }
  interactive?: {
    type: "button" | "list"
    body: { text: string }
    action: {
      buttons?: Array<{ type: string; reply: { id: string; title: string } }>
      sections?: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>
    }
  }
}

export interface IncomingMessage {
  from: string
  id: string
  timestamp: string
  type: "text" | "interactive" | "button"
  text?: { body: string }
  interactive?: {
    type: string
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string }
  }
}

// Send a text message
export async function sendTextMessage(to: string, message: string): Promise<boolean> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.error("[WhatsApp] Missing configuration")
    return false
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to.replace(/\D/g, ""), // Remove non-digits
          type: "text",
          text: { body: message },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("[WhatsApp] Send error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[WhatsApp] Send error:", error)
    return false
  }
}

// Send interactive buttons
export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<boolean> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return false
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to.replace(/\D/g, ""),
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: bodyText },
            action: {
              buttons: buttons.slice(0, 3).map((btn) => ({
                type: "reply",
                reply: { id: btn.id, title: btn.title.slice(0, 20) },
              })),
            },
          },
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error("[WhatsApp] Send buttons error:", error)
    return false
  }
}

// Send reminder notification
export async function sendReminderNotification(
  to: string,
  title: string,
  description?: string,
  reminderId?: string
): Promise<boolean> {
  const message = description
    ? `🔔 *تذكير: ${title}*\n\n${description}`
    : `🔔 *تذكير: ${title}*`

  if (reminderId) {
    return sendInteractiveButtons(to, message, [
      { id: `done_${reminderId}`, title: "✓ تم" },
      { id: `snooze_${reminderId}`, title: "⏰ تأجيل" },
    ])
  }

  return sendTextMessage(to, message)
}

// Send task reminder
export async function sendTaskReminder(
  to: string,
  taskTitle: string,
  dueDate: Date,
  taskId: string
): Promise<boolean> {
  const formattedDate = new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dueDate)

  const message = `📋 *مهمة قادمة*\n\n*${taskTitle}*\nالموعد: ${formattedDate}`

  return sendInteractiveButtons(to, message, [
    { id: `task_done_${taskId}`, title: "✓ إنجاز" },
    { id: `task_snooze_${taskId}`, title: "⏰ تأجيل" },
  ])
}

// Send meeting reminder
export async function sendMeetingReminder(
  to: string,
  title: string,
  startTime: Date,
  location?: string,
  meetingUrl?: string,
  meetingId?: string
): Promise<boolean> {
  const formattedTime = new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(startTime)

  let message = `📅 *اجتماع قادم*\n\n*${title}*\nالوقت: ${formattedTime}`
  if (location) message += `\nالمكان: ${location}`
  if (meetingUrl) message += `\nالرابط: ${meetingUrl}`

  if (meetingId) {
    return sendInteractiveButtons(to, message, [
      { id: `meeting_confirm_${meetingId}`, title: "✓ سأحضر" },
      { id: `meeting_cancel_${meetingId}`, title: "✗ إلغاء" },
    ])
  }

  return sendTextMessage(to, message)
}

// Send grocery list
export async function sendGroceryList(
  to: string,
  listName: string,
  items: Array<{ name: string; quantity: number; unit?: string; checked: boolean }>
): Promise<boolean> {
  const uncheckedItems = items.filter((i) => !i.checked)
  const checkedItems = items.filter((i) => i.checked)

  let message = `🛒 *${listName}*\n\n`

  if (uncheckedItems.length > 0) {
    message += "*المتبقي:*\n"
    uncheckedItems.forEach((item) => {
      const qty = item.quantity > 1 ? ` (${item.quantity}${item.unit ? " " + item.unit : ""})` : ""
      message += `☐ ${item.name}${qty}\n`
    })
  }

  if (checkedItems.length > 0) {
    message += "\n*تم شراؤه:*\n"
    checkedItems.forEach((item) => {
      message += `☑ ~${item.name}~\n`
    })
  }

  if (items.length === 0) {
    message += "القائمة فارغة! أرسل اسم المنتج لإضافته."
  }

  return sendTextMessage(to, message)
}

// Verify webhook (for Meta webhook verification)
export function verifyWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null
): string | null {
  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    return challenge
  }
  return null
}

// Parse incoming webhook payload
export function parseWebhookPayload(body: any): IncomingMessage | null {
  try {
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    if (!message) return null

    return {
      from: message.from,
      id: message.id,
      timestamp: message.timestamp,
      type: message.type,
      text: message.text,
      interactive: message.interactive,
    }
  } catch {
    return null
  }
}

// Message templates for common responses
export const MESSAGES = {
  ar: {
    welcome: "مرحباً بك في ذكرني! 👋\n\nيمكنني مساعدتك في:\n• إنشاء تذكيرات\n• إدارة المهام\n• قوائم التسوق\n• تذكيرات الاجتماعات\n\nأرسل 'مساعدة' للمزيد من المعلومات.",
    help: "*الأوامر المتاحة:*\n\n📝 *التذكيرات:*\nذكرني [النص] في [الوقت]\nذكرني كل يوم في [الوقت]\n\n📋 *المهام:*\nمهمة [العنوان]\nأضف مهمة [العنوان]\n\n🛒 *التسوق:*\nقائمة التسوق\nأضف [المنتج]\nتم شراء [المنتج]\n\n📅 *الاجتماعات:*\nاجتماع [العنوان] في [الوقت]",
    reminderCreated: (title: string, time: string) => `✅ تم إنشاء التذكير:\n*${title}*\nفي: ${time}`,
    taskCreated: (title: string) => `✅ تمت إضافة المهمة:\n*${title}*`,
    itemAdded: (name: string) => `✅ تمت إضافة *${name}* للقائمة`,
    itemChecked: (name: string) => `☑ تم شراء *${name}*`,
    notUnderstood: "عذراً، لم أفهم طلبك. أرسل 'مساعدة' لمعرفة الأوامر المتاحة.",
    error: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  },
  en: {
    welcome: "Welcome to Thakirni! 👋\n\nI can help you with:\n• Creating reminders\n• Managing tasks\n• Grocery lists\n• Meeting reminders\n\nSend 'help' for more info.",
    help: "*Available commands:*\n\n📝 *Reminders:*\nRemind me [text] at [time]\nRemind me daily at [time]\n\n📋 *Tasks:*\nTask [title]\nAdd task [title]\n\n🛒 *Grocery:*\nGrocery list\nAdd [item]\nBought [item]\n\n📅 *Meetings:*\nMeeting [title] at [time]",
    reminderCreated: (title: string, time: string) => `✅ Reminder created:\n*${title}*\nAt: ${time}`,
    taskCreated: (title: string) => `✅ Task added:\n*${title}*`,
    itemAdded: (name: string) => `✅ Added *${name}* to list`,
    itemChecked: (name: string) => `☑ Bought *${name}*`,
    notUnderstood: "Sorry, I didn't understand. Send 'help' to see available commands.",
    error: "An error occurred. Please try again.",
  },
}
