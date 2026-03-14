import { NextRequest } from "next/server"
import { createGroq } from "@ai-sdk/groq"
import { generateText, tool } from "ai"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage, downloadKapsoMedia } from "@/lib/kapso"

export const maxDuration = 60

// ─── SQL migration (run once in Supabase SQL Editor) ──────────────────────────
// alter table public.profiles add column if not exists phone_number text unique;
// create index if not exists profiles_phone_idx on public.profiles(phone_number);

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

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
        // Kapso sends signature as hex or base64 — try both
        const sigBase64 = Buffer.from(sigBuffer).toString("base64")
        return signature === sigHex || signature === sigBase64 || `sha256=${sigHex}` === signature
    } catch {
        return false
    }
}

// ─── Transcribe audio via Groq Whisper ───────────────────────────────────────

async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: mimeType })
    formData.append("file", blob, "audio.ogg")
    formData.append("model", "whisper-large-v3")

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
        body: formData,
    })

    if (!res.ok) throw new Error(`[Whisper] transcription failed: ${res.status}`)
    const data = await res.json()
    return data.text ?? ""
}

// ─── Main Webhook Handler ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const rawBody = await req.text()
    const signature = req.headers.get("x-webhook-signature") ?? ""
    const eventType = req.headers.get("x-webhook-event") ?? ""

    // ── Verify signature ────────────────────────────────────────────────────────
    const secret = process.env.KAPSO_WEBHOOK_SECRET
    if (secret) {
        const valid = await verifySignature(rawBody, signature, secret)
        if (!valid) {
            console.warn("[WhatsApp Webhook] Invalid signature")
            return new Response("Unauthorized", { status: 401 })
        }
    }

    // ── Only handle message events ──────────────────────────────────────────────
    if (eventType !== "whatsapp.message.received") {
        return new Response("OK", { status: 200 })
    }

    let payload: any
    try {
        payload = JSON.parse(rawBody)
    } catch {
        return new Response("Invalid JSON", { status: 400 })
    }

    // Kapso wraps messages in { type, batch, data: [...] }
    const events = Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
            ? payload
            : [payload]

    // Process async — return 200 immediately so Kapso doesn't timeout
    processEvents(events).catch(err =>
        console.error("[WhatsApp Webhook] Processing error:", err)
    )

    return new Response("OK", { status: 200 })
}

// ─── Process Events ───────────────────────────────────────────────────────────

async function processEvents(events: any[]) {
    const supabase = createServiceClient()

    for (const event of events) {
        try {
            await processMessage(event, supabase)
        } catch (err: any) {
            console.error("[WhatsApp] Failed to process event:", err?.message)
        }
    }
}

async function processMessage(event: any, supabase: any) {
    // Kapso payload structure per docs
    const message = event.message ?? event
    // phone is in message.from (no +) or message.kapso.phone_number (with +)
    const rawPhone = message.from ?? message.kapso?.phone_number ?? event.conversation?.phone_number ?? ""
    // normalise to no-plus format for DB lookup (stored as 966xxxxxxxxx)
    const phone = rawPhone.replace(/^\+/, "")
    const msgType = message.type ?? "text"

    if (!phone) {
        console.warn("[WhatsApp] No phone number in event")
        return
    }

    // ── Get message text ────────────────────────────────────────────────────────
    let messageText = ""

    if (msgType === "text") {
        messageText = message.text?.body ?? message.body ?? message.text ?? ""
    } else if (msgType === "audio" || msgType === "voice") {
        // Transcribe voice note
        const mediaUrl = message.audio?.url ?? message.voice?.url ?? message.media_url
        if (mediaUrl) {
            try {
                const audioBuffer = await downloadKapsoMedia(mediaUrl)
                messageText = await transcribeAudio(audioBuffer, "audio/ogg")
                console.log(`[WhatsApp] Transcribed: "${messageText}"`)
            } catch (err: any) {
                console.error("[WhatsApp] Transcription failed:", err?.message)
                await sendWhatsAppMessage(phone,
                    detectLanguage("") === "ar"
                        ? "عذراً، لم أتمكن من معالجة الرسالة الصوتية. حاول مرة أخرى أو أرسل نصاً."
                        : "Sorry, I couldn't process the voice message. Please try again or send text."
                )
                return
            }
        }
    } else {
        // Unsupported message type
        await sendWhatsAppMessage(phone,
            "عذراً، لا أدعم هذا النوع من الرسائل بعد. أرسل نصاً أو رسالة صوتية 🙏"
        )
        return
    }

    if (!messageText.trim()) return

    // ── Look up user by phone number ────────────────────────────────────────────
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, plan_tier")
        .eq("phone_number", phone)
        .single()

    if (!profile) {
        // User not registered
        const lang = detectLanguage(messageText)
        await sendWhatsAppMessage(phone,
            lang === "ar"
                ? "أهلاً! 👋 لاستخدام ذكرني عبر واتساب، سجّل أولاً في:\n🌐 thakirni.com\n\nبعد التسجيل، أضف رقم هاتفك في الإعدادات وعد هنا 🧠"
                : "Hello! 👋 To use Thakirni on WhatsApp, please register first at:\n🌐 thakirni.com\n\nAfter signing up, add your phone number in settings and come back here 🧠"
        )
        return
    }

    const userId = profile.id
    const profileName = profile.full_name ?? ""
    const lang = detectLanguage(messageText)

    // ── Load user context ───────────────────────────────────────────────────────
    const [factsRes, historyRes] = await Promise.all([
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
    ])

    // Build facts block
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

    // Build conversation history (oldest first)
    const history = historyRes.data
        ? [...historyRes.data].reverse().map((m: any) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }))
        : []

    // ── Save user message ───────────────────────────────────────────────────────
    await supabase.from("conversations").insert({
        user_id: userId,
        role: "user",
        content: messageText,
    })

    // ── Build time context ──────────────────────────────────────────────────────
    const { currentDate, currentTime, currentDayName, timeOfDay, addDays } = getSaudiTime()

    const langInstruction = lang === "ar"
        ? "⚠️ MANDATORY: Reply in ARABIC only. Never switch to English."
        : "⚠️ MANDATORY: Reply in ENGLISH only."

    // ── Call Groq ───────────────────────────────────────────────────────────────
    const { text: aiResponse } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        maxSteps: 10,
        messages: [
            ...history,
            { role: "user", content: messageText },
        ],

        system: `
${langInstruction}

You are Thakirni (ذكرني) — a warm, intelligent personal assistant and second brain.
${profileName ? `The user's name is ${profileName}.` : ""}
You are responding via WhatsApp — keep replies concise and conversational.

━━━━━━━━━━━━━━━━━━━━
🕒 CONTEXT (Riyadh)
  Date: ${currentDate} (${currentDayName})
  Time: ${currentTime} (${timeOfDay})
  Tomorrow: ${addDays(1)}
━━━━━━━━━━━━━━━━━━━━
${factsBlock}

WHATSAPP RULES — CRITICAL:
- NO markdown: no **, no ##, no bullet "-" — WhatsApp doesn't render them
- Use emojis for structure instead: ✅ 📅 🧠 ⏰ 📍
- Keep replies SHORT — 1 to 4 sentences max unless listing plans
- Never say "How can I help you today?" after someone shares personal info
- If user greets → call list_plans(date_filter="today") and give a brief warm briefing

PERSONA & TONE:
- Warm, concise, natural — like a highly organised colleague
- Mirror the user's language strictly (follow the ⚠️ above)
- Acknowledge stress briefly before diving into logistics
- After storing a fact silently, respond with genuine natural engagement

SECOND BRAIN:
- General info (wifi, birthdays, notes) → call save_memory, briefly confirm
- Personal facts (job, family, health, preferences) → call store_fact SILENTLY, no announcement
- Check facts above before storing to avoid duplicates

TASK MANAGEMENT:
- Collect Then Act: never call create_plan until you have ALL required fields
- Ask ONE missing field at a time
- Smart defaults: no date = today (${currentDate}), no end time = +1 hour
- After tool success: confirm briefly in plain text

TOOLS AVAILABLE:
create_plan / update_plan / delete_plan / mark_done / list_plans
save_memory / search_memories / store_fact / get_my_facts / get_timeline
`,

        tools: {

            create_plan: tool({
                description: "Create a calendar event, task, or shopping list. Collect all required fields first.",
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
                description: "Delete a plan. Use list_plans first to get the plan_id.",
                parameters: z.object({ plan_id: z.string() }),
                execute: async ({ plan_id }) => {
                    const { error } = await supabase.from("plans").delete().eq("id", plan_id).eq("user_id", userId)
                    if (error) return { success: false, message: error.message }
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

        },
    })

    // ── Save AI response & send via WhatsApp ────────────────────────────────────
    await Promise.all([
        supabase.from("conversations").insert({
            user_id: userId,
            role: "assistant",
            content: aiResponse,
        }),
        sendWhatsAppMessage(phone, aiResponse),
    ])

    console.log(`[WhatsApp] Replied to ${phone}: "${aiResponse.slice(0, 80)}..."`)
}