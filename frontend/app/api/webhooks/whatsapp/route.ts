import { NextRequest } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage, downloadKapsoMedia } from "@/lib/whatsapp/kapso"
import { rateLimit } from "@/lib/rate-limit"

export const maxDuration = 60

// ─── SQL migration (run once in Supabase SQL Editor) ──────────────────────────
// alter table public.profiles add column if not exists phone_number text unique;
// create index if not exists profiles_phone_idx on public.profiles(phone_number);

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

// ─── Time Helpers ─────────────────────────────────────────────────────────────

function getSaudiTime() {
    const now = new Date()
    const tz = "Asia/Riyadh"
    const currentDate = now.toLocaleDateString("en-CA", { timeZone: tz })
    const currentTime = now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }).slice(0, 5)
    const currentDayName = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long" })
    const currentHour = parseInt(now.toLocaleTimeString("en-GB", { timeZone: tz, hour12: false }).slice(0, 2))

    const addDays = (d: number) => {
        const dt = new Date(now)
        dt.setDate(dt.getDate() + d)
        return dt.toLocaleDateString("en-CA", { timeZone: tz })
    }

    const timeOfDay =
        currentHour < 12 ? "morning" :
            currentHour < 17 ? "afternoon" :
                currentHour < 21 ? "evening" : "night"

    return { currentDate, currentTime, currentDayName, currentHour, timeOfDay, addDays }
}

// ─── Language Detection ───────────────────────────────────────────────────────

function detectLanguage(text: string): "ar" | "en" {
    return /[\u0600-\u06FF]/.test(text) ? "ar" : "en"
}

// ─── Signature Verification ───────────────────────────────────────────────────

async function verifySignature(
    rawBody: string,
    signature: string,
    secret: string,
): Promise<boolean> {
    try {
        const encoder = new TextEncoder()
        const keyData = encoder.encode(secret)
        const msgData = encoder.encode(rawBody)
        const cryptoKey = await crypto.subtle.importKey(
            "raw", keyData,
            { name: "HMAC", hash: "SHA-256" },
            false, ["sign"],
        )
        const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData)
        const sigHex = Array.from(new Uint8Array(sigBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("")
        const sigBase64 = Buffer.from(sigBuffer).toString("base64")
        return signature === sigHex || signature === sigBase64 || `sha256=${sigHex}` === signature
    } catch {
        return false
    }
}

// ─── Transcribe audio via Gemini ─────────────────────────────────────────────

async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const { text } = await generateText({
        model: google("gemini-flash-latest"),
        messages: [{
            role: "user",
            content: [
                { type: "text", text: "Transcribe this audio message. Return only the transcript text, nothing else." },
                { type: "file", data: audioBuffer, mimeType },
            ],
        }],
    })
    return text.trim()
}

// ─── Main Webhook Handler ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const rawBody = await req.text()
    const signature = req.headers.get("x-webhook-signature") ?? ""
    const eventType = req.headers.get("x-webhook-event") ?? ""

    const secret = process.env.KAPSO_WEBHOOK_SECRET
    if (secret) {
        const valid = await verifySignature(rawBody, signature, secret)
        if (!valid) {
            console.warn("[WhatsApp Webhook] Invalid signature")
            return new Response("Unauthorized", { status: 401 })
        }
    }

    if (eventType !== "whatsapp.message.received") {
        return new Response("OK", { status: 200 })
    }

    let payload: unknown
    try {
        payload = JSON.parse(rawBody)
    } catch {
        return new Response("Invalid JSON", { status: 400 })
    }

    const events = Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: unknown[] }).data
        : Array.isArray(payload)
            ? payload
            : [payload]

    try {
        await processEvents(events)
    } catch (err: unknown) {
        console.error("[WhatsApp Webhook] Processing error:", (err as Error)?.message)
    }

    return new Response("OK", { status: 200 })
}

// ─── Process Events ───────────────────────────────────────────────────────────

async function processEvents(events: unknown[]) {
    const supabase = createServiceClient()

    for (const event of events) {
        try {
            await processMessage(event, supabase)
        } catch (err: unknown) {
            console.error("[WhatsApp] Failed to process event:", (err as Error)?.message)
        }
    }
}

async function processMessage(event: unknown, supabase: ReturnType<typeof createServiceClient>) {
    const ev = event as Record<string, unknown>
    const message = (ev.message ?? ev) as Record<string, unknown>
    const conversation = ev.conversation as Record<string, unknown> | undefined
    const kapso = message.kapso as Record<string, unknown> | undefined
    const rawPhone = (message.from ?? kapso?.phone_number ?? conversation?.phone_number ?? "") as string
    const phone = rawPhone.replace(/^\+/, "")
    const msgType = (message.type ?? "text") as string

    if (!phone) {
        console.warn("[WhatsApp] No phone number in event")
        return
    }

    // ── Rate limiting: 30 messages per minute per phone ─────────────────────────
    const rl = await rateLimit(`whatsapp:${phone}`, 30, 60_000)
    if (!rl.success) return // silently drop, don't error

    // ── Get message text ────────────────────────────────────────────────────────
    let messageText = ""

    if (msgType === "text") {
        const textObj = message.text as Record<string, unknown> | undefined
        messageText = (textObj?.body ?? message.body ?? message.text ?? "") as string
    } else if (msgType === "audio" || msgType === "voice") {
        const audioObj = message.audio as Record<string, unknown> | undefined
        const voiceObj = message.voice as Record<string, unknown> | undefined
        const mediaUrl = (audioObj?.url ?? voiceObj?.url ?? message.media_url) as string | undefined
        if (mediaUrl) {
            try {
                const audioBuffer = await downloadKapsoMedia(mediaUrl)
                messageText = await transcribeAudio(audioBuffer, "audio/ogg")
            } catch (err: unknown) {
                console.error("[WhatsApp] Transcription failed:", (err as Error)?.message)
                await sendWhatsAppMessage(phone,
                    detectLanguage("") === "ar"
                        ? "عذراً، لم أتمكن من معالجة الرسالة الصوتية. حاول مرة أخرى أو أرسل نصاً."
                        : "Sorry, I couldn't process the voice message. Please try again or send text."
                )
                return
            }
        }
    } else {
        await sendWhatsAppMessage(phone, "عذراً، لا أدعم هذا النوع من الرسائل بعد. أرسل نصاً أو رسالة صوتية 🙏")
        return
    }

    if (!messageText.trim()) return

    // ── Look up user by phone number ────────────────────────────────────────────
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, plan_tier, google_calendar_token, google_calendar_refresh_token, google_calendar_expires_at, preferred_language")
        .eq("phone_number", phone)
        .single()

    if (!profile) {
        const lang = detectLanguage(messageText)
        await sendWhatsAppMessage(phone,
            lang === "ar"
                ? "أهلاً! 👋 لاستخدام ذكرني عبر واتساب، سجّل أولاً في:\n🌐 thakirni.com\n\nبعد التسجيل، أضف رقم هاتفك في الإعدادات وعد هنا 🧠"
                : "Hello! 👋 To use Thakirni on WhatsApp, please register first at:\n🌐 thakirni.com\n\nAfter signing up, add your phone number in settings and come back here 🧠"
        )
        return
    }

    const userId = profile.id as string
    const profileName = (profile.full_name ?? "") as string
    const lang = detectLanguage(messageText)

    // ── Load user context ───────────────────────────────────────────────────────
    const { currentDate, currentTime, currentDayName, timeOfDay, addDays } = getSaudiTime()

    const [factsRes, historyRes, todayPlansRes] = await Promise.all([
        supabase
            .from("user_facts")
            .select("fact, category")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(30),

        supabase
            .from("conversations")
            .select("role, content")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10),

        supabase
            .from("plans")
            .select("title, plan_time, category, location")
            .eq("user_id", userId)
            .eq("plan_date", currentDate)
            .eq("status", "pending")
            .order("plan_time", { ascending: true })
            .limit(10),
    ])

    let factsBlock = ""
    if (factsRes.data && factsRes.data.length > 0) {
        const byCategory: Record<string, string[]> = {}
        for (const { fact, category } of factsRes.data) {
            if (!byCategory[category]) byCategory[category] = []
            byCategory[category].push(fact)
        }
        const lines = Object.entries(byCategory)
            .map(([cat, facts]) => `[${cat}] ${facts.join(" • ")}`)
            .join("\n")
        factsBlock = `\n🧠 WHAT I KNOW ABOUT YOU:\n${lines}`
    }

    let todayBlock = ""
    if (todayPlansRes.data && todayPlansRes.data.length > 0) {
        const planLines = todayPlansRes.data.map((p: { title: string; plan_time: string | null; category: string; location: string | null }) => {
            const time = p.plan_time ? p.plan_time.slice(0, 5) + " " : ""
            const loc = p.location ? ` @ ${p.location}` : ""
            return `• ${time}${p.title}${loc} [${p.category}]`
        }).join("\n")
        todayBlock = `\n📅 TODAY'S PLANS:\n${planLines}`
    }

    const history = historyRes.data
        ? [...historyRes.data].reverse().map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }))
        : []

    await supabase.from("conversations").insert({
        user_id: userId,
        role: "user",
        content: messageText,
    })

    const langInstruction = lang === "ar"
        ? "⚠️ MANDATORY: Reply in ARABIC only. Never switch to English."
        : "⚠️ MANDATORY: Reply in ENGLISH only."

    const { text: aiResponse } = await generateText({
        model: google("gemini-flash-latest"),
        maxSteps: 10,
        messages: [
            ...history,
            { role: "user", content: messageText },
        ],

        system: `
${langInstruction}

You are Thakirni (ذكرني).

You're not an assistant — you're the user's closest friend.
You talk like someone from Khobar / Eastern Saudi Arabia.
Natural, chill, real.

${profileName ? `The user's name is ${profileName}.` : ""}

━━━━━━━━━━━━━━━━━━━━
🕒 ${currentDate} (${currentDayName}) · ${currentTime} · ${timeOfDay} · Riyadh
━━━━━━━━━━━━━━━━━━━━
${factsBlock}
${todayBlock}

════════════════════
LANGUAGE STYLE (VERY IMPORTANT)
════════════════════

Match the user's language:

If they speak Arabic:
→ Use Saudi Khobar dialect (NOT formal Arabic)
→ Examples:
  "وش قاعد تسوي؟"
  "طيب خلنا نشوف"
  "صدق؟"
  "يلا تمام"
  "مدري أحس..."
  "مره كويس"

If they speak English:
→ Use natural casual English
→ Like texting a friend

If they mix:
→ Mix naturally (Arabizi style is OK)

NEVER use:
❌ Formal Arabic (مثل: "كيف يمكنني مساعدتك؟")
❌ Corporate English ("Certainly", "I'd be happy to assist")

════════════════════
PERSONALITY
════════════════════

You're:
→ Curious
→ Honest
→ Chill
→ Slightly funny sometimes
→ Comfortable disagreeing

Examples:
✅ "مدري أحس مو أفضل فكرة"
✅ "wait ليه سويت كذا 😭"
✅ "that actually sounds fun"
❌ "بالتأكيد!"
❌ "That's a great question!"

════════════════════
HOW YOU TALK
════════════════════

• 1–3 sentences for normal replies
• No overexplaining
• Ask ONE follow-up max
• React like a real person

Mirror energy:
- فضفضة → تعاطف أول
- حماس → تحمس معه
- سوال → جاوب مباشرة

Don't over-help:
❌ لا تقترح تضيف شيء للتقويم بدون سبب
❌ لا تصير assistant رسمي
❌ لا تكرر "يمكنني مساعدتك" أبداً — تبدو روبوت

إذا سألك "ايش تقدر تسوي" أو "ايش الفايدة منك":
→ جاوب بجملتين MAX، بشكل طبيعي وخفيف
→ مثال: "باختصار؟ ذاكرتك الثانية. أضيف مواعيدك، أذكّرك فيها، أحفظ أي شي تقول لي احفظه — وأتكلم معك بشكل طبيعي. تجرب؟"
❌ لا تعطي قائمة features رسمية  

════════════════════
WHATSAPP FORMAT
════════════════════

• NO markdown (**, ##, -)
• Use emojis lightly:
  📅 ⏰ 📍 ✅

• Example:
"📅 اليوم:
⏰ 3:00 اجتماع
⏰ 6:00 نادي"

Keep it clean and readable

════════════════════
التحيات (مهم جداً)
════════════════════

🚨 إذا قال "سلام" أو "هلا" أو "مرحبا" أو "hey" أو "hi" أو أي تحية:
→ هذه تحية فقط — لا تستدعي أي tool إطلاقاً
→ رد بشكل طبيعي واسأله كيفه
→ إذا في جدول اليوم محمّل أعلاه، اذكر أهم شيء باختصار
→ لا تقول "تم تسجيل" أو "ضفت" أبداً عند التحية
→ مثال: "وعليكم السلام 😄 كيفك؟ عندك [X] اليوم"

════════════════════
TASK MODE (مهم)
════════════════════

🚨 create_plan تُستدعى فقط إذا قال صراحةً:
"ضيف" / "سجّل" / "حدد موعد" / "ذكّرني" / "schedule" / "remind me" / "add"

للاجتماعات لازم تجمع:
1. العنوان
2. التاريخ
3. الوقت ← لازم تسأل
4. المكان ← لازم تسأل

قواعد:
• سؤال واحد كل مرة
• لا تفترض أي شيء
• لا تستدعي create_plan قبل ما تجمع كل المعلومات وتأكد

مثال:
User: ضيف اجتماع الأحد
→ "اي ساعة؟"
User: 3
→ "وين؟"
User: المكتب
→ "اجتماع الأحد الساعة 3 بالمكتب — أضيفها؟"
User: أيه
→ [الآن فقط استدعي create_plan]

للمهام:
→ العنوان يكفي (اليوم تلقائي)

بعد التنفيذ:
→ "تمام ضفتها" / "done 👍"

════════════════════
التصحيحات
════════════════════

إذا قال "ما قلت لك سجل" أو "ما طلبت منك كذا" أو "ليش سويت كذا":
→ اعترف فوراً: "آسف، غلطت — ما كان لازم أضيف شي"
→ لا تتبرر، لا تكرر نفس الغلطة
→ إذا أضفت شي بالغلط وقدرت تحذفه، اسأله: "تبي أحذفها؟"

════════════════════
SECOND BRAIN
════════════════════

أي شيء شخصي:
→ store_fact (بدون ما تقول له)

أي ملاحظة:
→ save_memory

استخدم المعلومات بشكل طبيعي:
"مو انت قلت عندك اجتماع اليوم؟"

════════════════════
ERRORS
════════════════════

إذا صار خطأ:
→ "صار شي غلط، جرب مرة ثانية"

إذا مو متأكد:
→ "مدري 100% بس أحس..."

════════════════════
TOOLS
════════════════════

create_plan
update_plan
delete_plan → يحتاج UUID، استخدم search_plans أو list_plans أول
mark_done → يحتاج UUID، استخدم search_plans أو list_plans أول
list_plans
search_plans → للبحث عن خطة باسمها وتحصل على UUID
save_memory
search_memories
store_fact
get_my_facts
set_reminder

RULE:
→ لا تقول اسم التول
→ لا تطلع JSON
→ بس رد زي انسان طبيعي
→ إذا المستخدم قال احذف/عدّل شي باسمه → استخدم search_plans أول تحصل على ID

`,

        tools: {

            create_plan: tool({
                description: "Create a calendar event, task, or shopping list. ONLY call this when the user has EXPLICITLY asked to add/schedule/remind something using words like ضيف/سجّل/ذكّرني/schedule/add/remind. NEVER call this for greetings, casual chat, or questions.",
                parameters: z.object({
                    title: z.string(),
                    description: z.string().optional(),
                    plan_date: z.string().describe(`YYYY-MM-DD. Today = ${currentDate}`),
                    plan_time: z.string().optional().describe("HH:MM:SS"),
                    end_time: z.string().optional(),
                    is_all_day: z.boolean().optional(),
                    location: z.string().optional(),
                    attendees: z.array(z.string()).optional(),
                    category: z.enum(["task", "meeting", "grocery", "work", "personal", "health", "finance", "other"]),
                    priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
                    recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional().default("none"),
                }),
                execute: async (input) => {
                    let endTime = input.end_time
                    if (input.plan_time && !endTime) {
                        const [h, m] = input.plan_time.split(":").map(Number)
                        endTime = `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`
                    }
                    const { data, error } = await supabase.from("plans").insert({
                        user_id: userId,
                        title: input.title,
                        description: input.description ?? null,
                        plan_date: input.plan_date,
                        plan_time: input.plan_time ?? null,
                        end_time: endTime ?? null,
                        location: input.location ?? null,
                        attendees: input.attendees ?? [],
                        category: input.category,
                        priority: input.priority ?? "medium",
                        recurrence: input.recurrence ?? "none",
                        is_all_day: input.is_all_day ?? false,
                        status: "pending",
                    }).select().single()
                    if (error) return { success: false, message: error.message }

                    // Sync to Google Calendar
                    if (profile.google_calendar_token) {
                        try {
                            let gcalToken = profile.google_calendar_token as string
                            // Refresh if expired
                            if (profile.google_calendar_expires_at && Date.now() > new Date(profile.google_calendar_expires_at as string).getTime() - 60_000 && profile.google_calendar_refresh_token) {
                                const rr = await fetch("https://oauth2.googleapis.com/token", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                                    body: new URLSearchParams({ refresh_token: profile.google_calendar_refresh_token as string, client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", grant_type: "refresh_token" }),
                                })
                                if (rr.ok) {
                                    const rd = await rr.json() as { access_token: string; expires_in: number }
                                    gcalToken = rd.access_token
                                    supabase.from("profiles").update({ google_calendar_token: gcalToken, google_calendar_expires_at: new Date(Date.now() + rd.expires_in * 1000).toISOString() }).eq("id", userId).then(undefined, (e) => console.error("[whatsapp] gcal token save error:", e))
                                }
                            }
                            const gcalEvent: Record<string, unknown> = { summary: input.title }
                            if (input.description) gcalEvent.description = input.description
                            if (input.location) gcalEvent.location = input.location
                            if (input.is_all_day || !input.plan_time) {
                                gcalEvent.start = { date: input.plan_date }
                                gcalEvent.end = { date: input.plan_date }
                            } else {
                                gcalEvent.start = { dateTime: `${input.plan_date}T${input.plan_time}:00`, timeZone: "Asia/Riyadh" }
                                gcalEvent.end = { dateTime: `${input.plan_date}T${endTime ?? input.plan_time}:00`, timeZone: "Asia/Riyadh" }
                            }
                            const gcalRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
                                method: "POST",
                                headers: { Authorization: `Bearer ${gcalToken}`, "Content-Type": "application/json" },
                                body: JSON.stringify(gcalEvent),
                            })
                            if (gcalRes.ok) {
                                const gcalData = await gcalRes.json() as { id: string }
                                supabase.from("plans").update({ gcal_event_id: gcalData.id }).eq("id", data.id).then(undefined, (e) => console.error("[whatsapp] gcal_event_id save error:", e))
                            }
                        } catch (err) { console.error("[API] silent catch:", err) }
                    }

                    // Auto WhatsApp reminder 30 min before timed events
                    if (input.plan_time && !input.is_all_day) {
                        try {
                            const eventMs = new Date(`${input.plan_date}T${input.plan_time}:00`).getTime() - 3 * 60 * 60 * 1000
                            const remindMs = eventMs - 30 * 60 * 1000
                            if (remindMs > Date.now()) {
                                supabase.from("reminders").insert({ user_id: userId, title: input.title, remind_at: new Date(remindMs).toISOString(), plan_id: data.id, channel: "whatsapp", is_sent: false }).then(undefined, (e) => console.error("[whatsapp] reminder insert error:", e))
                            }
                        } catch (err) { console.error("[API] silent catch:", err) }
                    }

                    return { success: true, message: `Scheduled "${input.title}" on ${input.plan_date}${input.plan_time ? " at " + input.plan_time.slice(0, 5) : ""}.` }
                },
            }),

            update_plan: tool({
                description: "Update an existing plan. Use list_plans first to get the plan_id.",
                parameters: z.object({
                    plan_id: z.string(),
                    title: z.string().optional(),
                    description: z.string().optional(),
                    plan_date: z.string().optional(),
                    plan_time: z.string().optional(),
                    end_time: z.string().optional(),
                    location: z.string().optional(),
                    attendees: z.array(z.string()).optional(),
                    priority: z.enum(["low", "medium", "high"]).optional(),
                    recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
                    status: z.enum(["pending", "done", "cancelled"]).optional(),
                }),
                execute: async (input) => {
                    const { plan_id, ...fields } = input
                    const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
                    const { error } = await supabase.from("plans").update(updates).eq("id", plan_id).eq("user_id", userId)
                    if (error) return { success: false, message: error.message }
                    return { success: true, message: "Plan updated." }
                },
            }),

            delete_plan: tool({
                description: "Delete a plan by its UUID. ALWAYS call search_plans or list_plans first to get the real plan_id — never pass a title or name as the plan_id.",
                parameters: z.object({ plan_id: z.string().describe("UUID from list_plans or search_plans — never a title") }),
                execute: async ({ plan_id }) => {
                    const { data: existing } = await supabase.from("plans").select("gcal_event_id").eq("id", plan_id).eq("user_id", userId).single()
                    const { error } = await supabase.from("plans").delete().eq("id", plan_id).eq("user_id", userId)
                    if (error) return { success: false, message: error.message }
                    // Cancel pending reminders
                    supabase.from("reminders").delete().eq("plan_id", plan_id).eq("is_sent", false).then(undefined, (e) => console.error("[whatsapp] reminder delete error:", e))
                    // Delete from Google Calendar
                    if (existing?.gcal_event_id && profile.google_calendar_token) {
                        fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.gcal_event_id as string}`, { method: "DELETE", headers: { Authorization: `Bearer ${profile.google_calendar_token as string}` } }).catch((e) => console.error("[whatsapp webhook] gcal event delete error:", e))
                    }
                    return { success: true, message: "Plan deleted." }
                },
            }),

            mark_done: tool({
                description: "Mark a plan as done.",
                parameters: z.object({ plan_id: z.string() }),
                execute: async ({ plan_id }) => {
                    const { error } = await supabase.from("plans").update({ status: "done" }).eq("id", plan_id).eq("user_id", userId)
                    if (error) return { success: false, message: error.message }
                    return { success: true, message: "Marked as done." }
                },
            }),

            list_plans: tool({
                description: "List the user's plans.",
                parameters: z.object({
                    date_filter: z.enum(["today", "tomorrow", "this_week", "upcoming", "all"]),
                    category: z.enum(["task", "meeting", "grocery", "work", "personal", "health", "finance", "other", "all"]).optional().default("all"),
                    status: z.enum(["pending", "done", "cancelled", "all"]).optional().default("pending"),
                }),
                execute: async ({ date_filter, category, status }) => {
                    let query = supabase.from("plans").select("*").eq("user_id", userId)
                        .order("plan_date", { ascending: true }).order("plan_time", { ascending: true })
                    if (date_filter === "today") query = query.eq("plan_date", currentDate)
                    else if (date_filter === "tomorrow") query = query.eq("plan_date", addDays(1))
                    else if (date_filter === "this_week") query = query.gte("plan_date", currentDate).lte("plan_date", addDays(7))
                    else if (date_filter === "upcoming") query = query.gte("plan_date", currentDate)
                    if (category && category !== "all") query = query.eq("category", category)
                    if (status && status !== "all") query = query.eq("status", status)
                    const { data, error } = await query
                    if (error) return { success: false, message: error.message, plans: [] }
                    return { success: true, plans: data ?? [], count: data?.length ?? 0 }
                },
            }),

            search_plans: tool({
                description: "Search plans by keyword/title. Use this when the user refers to a plan by name (e.g. 'delete testing', 'update my meeting with Ahmed') to find its UUID before calling delete_plan or update_plan.",
                parameters: z.object({
                    query: z.string().describe("Keyword or title to search for"),
                    status: z.enum(["pending", "done", "cancelled", "all"]).optional().default("all"),
                }),
                execute: async ({ query, status }) => {
                    let q = supabase.from("plans").select("*").eq("user_id", userId)
                        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                        .order("plan_date", { ascending: false }).limit(10)
                    if (status && status !== "all") q = q.eq("status", status)
                    const { data, error } = await q
                    if (error) return { success: false, message: error.message, plans: [] }
                    return { success: true, plans: data ?? [], count: data?.length ?? 0 }
                },
            }),

            save_memory: tool({
                description: "Save a note or fact to the user's Second Brain.",
                parameters: z.object({
                    content: z.string(),
                    tags: z.array(z.string()),
                }),
                execute: async ({ content, tags }) => {
                    const { error } = await supabase.from("memories").insert({ user_id: userId, content, tags })
                    if (error) return { success: false, message: error.message }
                    return { success: true, message: "Saved." }
                },
            }),

            search_memories: tool({
                description: "Search the user's Second Brain.",
                parameters: z.object({
                    query: z.string(),
                    tag: z.string().optional(),
                }),
                execute: async ({ query, tag }) => {
                    let q = supabase.from("memories").select("*").eq("user_id", userId)
                        .ilike("content", `%${query}%`).order("created_at", { ascending: false }).limit(10)
                    if (tag) q = q.contains("tags", [tag])
                    const { data, error } = await q
                    if (error) return { success: false, message: error.message, memories: [] }
                    return { success: true, memories: data ?? [], count: data?.length ?? 0 }
                },
            }),

            store_fact: tool({
                description: "Silently store a personal fact. Do NOT announce this to the user.",
                parameters: z.object({
                    fact: z.string(),
                    category: z.enum(["work", "family", "health", "finance", "preference", "location", "education", "contact", "general"]),
                }),
                execute: async ({ fact, category }) => {
                    const { data: existing } = await supabase.from("user_facts").select("id")
                        .eq("user_id", userId).eq("category", category).ilike("fact", `${fact.slice(0, 40)}%`).limit(1)
                    if (existing && existing.length > 0) {
                        await supabase.from("user_facts").update({ fact }).eq("id", existing[0].id)
                        return { success: true, message: "Fact updated." }
                    }
                    const { error } = await supabase.from("user_facts").insert({ user_id: userId, fact, category })
                    if (error) return { success: false, message: error.message }
                    return { success: true, message: "Fact stored." }
                },
            }),

            get_my_facts: tool({
                description: "Show the user what Thakirni knows about them.",
                parameters: z.object({
                    category: z.enum(["work", "family", "health", "finance", "preference", "location", "education", "contact", "general", "all"]).optional().default("all"),
                }),
                execute: async ({ category }) => {
                    let q = supabase.from("user_facts").select("fact, category").eq("user_id", userId).order("category")
                    if (category && category !== "all") q = q.eq("category", category)
                    const { data, error } = await q
                    if (error) return { success: false, message: error.message, facts: [] }
                    return { success: true, facts: data ?? [], count: data?.length ?? 0 }
                },
            }),

            get_timeline: tool({
                description: "Get the user's life timeline events.",
                parameters: z.object({
                    days_back: z.number().min(1).max(365).default(7),
                    source_type: z.enum(["plan_created", "plan_completed", "memory_saved", "file_uploaded", "voice_recorded", "fact_learned", "all"]).optional().default("all"),
                }),
                execute: async ({ days_back, source_type }) => {
                    let q = supabase.from("timeline_events").select("title, event_date, source_type")
                        .eq("user_id", userId).gte("event_date", addDays(-days_back))
                        .order("event_date", { ascending: false }).limit(40)
                    if (source_type && source_type !== "all") q = q.eq("source_type", source_type)
                    const { data, error } = await q
                    if (error) return { success: false, message: error.message, events: [] }
                    return { success: true, events: data ?? [], count: data?.length ?? 0 }
                },
            }),

            set_reminder: tool({
                description: "Schedule a reminder to be sent via WhatsApp at a specific time.",
                parameters: z.object({
                    title: z.string().describe("Reminder message"),
                    remind_at: z.string().describe("ISO datetime in Riyadh time e.g. 2026-03-25T15:00:00"),
                    plan_id: z.string().optional(),
                }),
                execute: async ({ title, remind_at, plan_id }) => {
                    const remindMs = new Date(remind_at).getTime() - 3 * 60 * 60 * 1000 // Riyadh to UTC
                    if (remindMs <= Date.now()) return { success: false, message: "Reminder time is in the past." }
                    const { error } = await supabase.from("reminders").insert({
                        user_id: userId,
                        title,
                        remind_at: new Date(remindMs).toISOString(),
                        plan_id: plan_id ?? null,
                        channel: "whatsapp",
                        is_sent: false,
                    })
                    if (error) return { success: false, message: error.message }
                    const when = new Date(remindMs).toLocaleString(lang === "ar" ? "ar-SA" : "en-GB", { timeZone: "Asia/Riyadh", dateStyle: "short", timeStyle: "short" })
                    return { success: true, message: `Reminder set for ${when}` }
                },
            }),

        },
    })

    await Promise.all([
        supabase.from("conversations").insert({
            user_id: userId,
            role: "assistant",
            content: aiResponse,
        }),
        sendWhatsAppMessage(phone, aiResponse),
    ])

}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const challenge = searchParams.get("challenge") ?? searchParams.get("hub.challenge") ?? "ok"
    return new Response(challenge, { status: 200 })
}
