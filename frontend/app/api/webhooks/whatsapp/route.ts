import { NextRequest } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, tool, stepCountIs } from "ai"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage, downloadKapsoMedia } from "@/lib/whatsapp/kapso"
import { rateLimit } from "@/lib/rate-limit"

export const maxDuration = 120

// ─── SQL migration (run once in Supabase SQL Editor) ──────────────────────────
// alter table public.profiles add column if not exists phone_number text unique;
// create index if not exists profiles_phone_idx on public.profiles(phone_number);

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

// ─── Gemini File API helpers (avoids convertToBase64 SDK bug for binary data) ──

async function uploadToGeminiFileApi(buffer: Buffer, mimeType: string, displayName: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? ""
    const boundary = `wa_boundary_${Date.now()}`
    const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${JSON.stringify({ file: { displayName, mimeType } })}\r\n`
    const dataPart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    const closing  = `\r\n--${boundary}--`
    const body = Buffer.concat([Buffer.from(metaPart), Buffer.from(dataPart), buffer, Buffer.from(closing)])
    const res = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}`, "X-Goog-Upload-Protocol": "multipart" }, body }
    )
    if (!res.ok) throw new Error(`File API upload failed (${res.status})`)
    const { file } = await res.json() as { file: { uri: string; name: string; state: string } }
    if (file.state !== "ACTIVE") {
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000))
            const check = await fetch(`https://generativelanguage.googleapis.com/v1beta/${file.name}?key=${apiKey}`)
            if (!check.ok) break
            const d = await check.json() as { state: string }
            if (d.state === "ACTIVE") break
            if (d.state === "FAILED") throw new Error("Gemini file processing FAILED")
        }
    }
    return file.uri
}

async function geminiWithFile(prompt: string, fileUri: string, mimeType: string): Promise<string> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? ""
    const body = {
        contents: [{ parts: [{ text: prompt }, { fileData: { mimeType, fileUri } }] }],
        generationConfig: { maxOutputTokens: 2000 },
    }
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    )
    if (!res.ok) throw new Error(`Gemini generateContent failed (${res.status})`)
    interface GRes { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const data = await res.json() as GRes
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

async function deleteGeminiFile(uri: string) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? ""
    const match = uri.match(/files\/[^/?]+/)
    if (match) await fetch(`https://generativelanguage.googleapis.com/v1beta/${match[0]}?key=${apiKey}`, { method: "DELETE" }).catch(() => {})
}

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

// ─── Common Typo Corrections (Arabic) ────────────────────────────────────────

function fixCommonTypos(text: string): string {
    return text
        .replace(/\bشكرني\b/g, "ذكرني")
        .replace(/\bشكّرني\b/g, "ذكّرني")
        .replace(/\bالحفص\b/g, "الفحص")
        .replace(/\bابي\b/g, "أبي")
        .replace(/\bايش\b/g, "إيش")
        .replace(/\bوقتي\b/g, "وقتي")
        .replace(/\bابدأ\b/g, "ابدأ")
        .replace(/ذكرن([يى])\b/g, "ذكرني")
        .replace(/\bضيقني\b/g, "ذكرني")
        .replace(/\bذكران\b/g, "ذكرني")
        // Remove excessive character repetition (حلوووو → حلوو)
        .replace(/(.)\1{2,}/g, "$1$1")
        // Normalise multiple spaces
        .replace(/\s{2,}/g, " ")
        .trim()
}

type Dialect = "khobar" | "najdi" | "hijazi" | "gulf" | "fus-ha"

function detectDialect(text: string): Dialect {
    if (/شنو|زين|هالسالفة|بعدين\b|چ/.test(text)) return "gulf"
    if (/إيش|ايش|كذا|عادي\b|مرة\b/.test(text)) return "hijazi"
    if (/أريد\b|اريد\b|ماذا\b|هل\s|يمكن\b/.test(text)) return "fus-ha"
    if (/وش\b|أبي\b|ابي\b|أبغى\b|الحين\b|ترى\b|خل\b/.test(text)) return "khobar"
    return "khobar"
}

// ─── Markdown Stripper (WhatsApp doesn't render ** or ##) ─────────────────────

function stripMarkdown(text: string): string {
    return text
        .replace(/\*\*([^*\n]+)\*\*/g, "$1")  // **bold** → bold
        .replace(/\*([^*\n]+)\*/g, "$1")       // *italic* → italic
        .replace(/^#{1,6}\s+/gm, "")           // ## headers
        .replace(/`([^`]+)`/g, "$1")           // `code`
        .trim()
}

// ─── Structured Logging ───────────────────────────────────────────────────────

function log(event: string, phone: string, detail?: string) {
    const ts = new Date().toISOString()
    console.log(`[WA:${event}] ${ts} | ${phone}${detail ? " | " + detail : ""}`)
}

// ─── Signature Verification ───────────────────────────────────────────────────
// Kapso sends the raw secret in the X-Webhook-Secret header

// ─── Transcribe audio via Gemini ─────────────────────────────────────────────

function normalizeAudioMime(mime: string): string {
    // Gemini rejects "audio/ogg; codecs=opus" — strip codec suffix
    return mime.split(";")[0].trim()
}

async function transcribeAudio(audioBuffer: Buffer, rawMimeType: string): Promise<string> {
    const mimeType = normalizeAudioMime(rawMimeType)
    const fileUri = await uploadToGeminiFileApi(audioBuffer, mimeType, `wa_audio_${Date.now()}`)
    try {
        const text = await geminiWithFile(
            "Transcribe this audio message exactly as spoken. Return only the transcript, nothing else.",
            fileUri, mimeType
        )
        return text.trim()
    } finally {
        deleteGeminiFile(fileUri).catch(() => {})
    }
}

// ─── Main Webhook Handler ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const rawBody = await req.text()

    // Force header materialization (NextRequest lazy-init quirk)
    const headerEntries: Record<string, string> = {}
    req.headers.forEach((v, k) => { headerEntries[k] = v })

    const eventType = headerEntries["x-webhook-event"] ?? ""

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
        return new Response("Processing failed", { status: 500 })
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

    // Log media message structure so we can diagnose URL extraction issues
    if (msgType === "audio" || msgType === "voice") {
        console.log("[WhatsApp] voice payload keys:", JSON.stringify({
            messageKeys: Object.keys(message),
            kapsoKeys: kapso ? Object.keys(kapso) : null,
            audioObj: message.audio,
            kapsoMediaUrl: kapso?.mediaUrl,
            kapsoMedia_url: (kapso as Record<string, unknown> | undefined)?.media_url,
            topLevelMediaUrl: message.media_url,
        }))
    }

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
        // Kapso enriches the message with pre-resolved media URLs in the kapso extension object.
        // WhatsApp's native audio.id is just a media ID — not a downloadable URL.
        const mediaUrl = (
            kapso?.mediaUrl ??                              // camelCase (SDK-parsed)
            (kapso as Record<string, unknown> | undefined)?.media_url ?? // snake_case (raw JSON)
            (message.media_url as string | undefined) ??    // top-level kapso field
            audioObj?.link                                  // fallback: direct link (rarely set)
        ) as string | undefined
        if (mediaUrl) {
            log("voice_received", phone)
            await sendWhatsAppMessage(phone, "سمعتك 👀 ثانية...")
            try {
                const audioBuffer = await downloadKapsoMedia(mediaUrl)
                if (audioBuffer.length > 25 * 1024 * 1024) {
                    await sendWhatsAppMessage(phone, "الفويس طويل شوي 😅 حاول تختصره وأرسله مرة ثانية")
                    return
                }
                const rawMimeType = (audioObj?.mime_type ?? "audio/ogg") as string
                messageText = await transcribeAudio(audioBuffer, rawMimeType)
                log("voice_transcribed", phone, `"${messageText.slice(0, 50)}"`)
            } catch (err: unknown) {
                log("voice_error", phone, (err as Error)?.message)
                await sendWhatsAppMessage(phone, "ما ضبط معي الصوت 😅 جرّب مرة ثانية أو أرسل نص")
                return
            }
        } else {
            log("voice_no_url", phone, "no media URL found in payload")
        }
    } else if (msgType === "document") {
        const docObj = message.document as Record<string, unknown> | undefined
        const mediaUrl = (docObj?.url ?? message.media_url) as string | undefined
        const mimeType = (docObj?.mime_type ?? "application/octet-stream") as string

        if (!mediaUrl) {
            await sendWhatsAppMessage(phone, "ما قدرت أحصل على الملف 🙏 جرّب مرة ثانية")
            return
        }

        if (!mimeType.includes("pdf")) {
            await sendWhatsAppMessage(phone, "للحين ما أدعم هذا النوع — أرسل PDF أو نص أو فويس 🙏")
            return
        }

        log("pdf_received", phone)
        await sendWhatsAppMessage(phone, "جالس أقرأ الملف 👀 لحظة...")

        try {
            const fileBuffer = await downloadKapsoMedia(mediaUrl)
            if (fileBuffer.length > 20 * 1024 * 1024) {
                await sendWhatsAppMessage(phone, "الملف كبير شوي 😅 حاول ترسل نسخة أصغر")
                return
            }
            const pdfUri = await uploadToGeminiFileApi(fileBuffer, "application/pdf", `wa_pdf_${Date.now()}`)
            let summary: string
            try {
                summary = await geminiWithFile(
                    "Extract and summarize the key points from this PDF document in the same language as the document. Be concise but comprehensive. Format with bullet points. If the PDF is unreadable or empty, respond only with: UNREADABLE",
                    pdfUri, "application/pdf"
                )
            } finally {
                deleteGeminiFile(pdfUri).catch(() => {})
            }
            if (summary.trim().toUpperCase() === "UNREADABLE") {
                await sendWhatsAppMessage(phone, "ما قدرت أستخرج شي واضح 🤔 جرّب ملف ثاني")
                return
            }
            log("pdf_processed", phone, `${fileBuffer.length} bytes`)
            messageText = `[هذا ملخص الملف 👇]\n${summary}`
        } catch (err: unknown) {
            log("pdf_error", phone, (err as Error)?.message)
            await sendWhatsAppMessage(phone, "ما قدرت أقرأ الـ PDF 😅 تأكد إن الملف واضح وجرّب مرة ثانية")
            return
        }
    } else {
        await sendWhatsAppMessage(phone, "أرسل:\n\n✍️ نص\n🎤 فويس\nأو 📄 PDF\nوأرتبها لك 👌")
        return
    }

    if (!messageText.trim()) return

    // ── Fix common Arabic typos ─────────────────────────────────────────────────
    messageText = fixCommonTypos(messageText)

    // ── Look up user by phone number ────────────────────────────────────────────
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, plan_tier, google_calendar_token, google_calendar_refresh_token, google_calendar_expires_at, preferred_language, dialect")
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

    // ── Dialect detection + persistence ─────────────────────────────────────────
    let storedDialect = (profile.dialect ?? "khobar") as Dialect
    // On first Arabic message (still at default), detect and persist
    if (storedDialect === "khobar" && lang === "ar") {
        const detected = detectDialect(messageText)
        if (detected !== "khobar") {
            storedDialect = detected
            supabase
                .from("profiles")
                .update({ dialect: detected })
                .eq("id", userId)
                .then(undefined, (err: unknown) => console.error("[WA] dialect save error:", err))
        }
    }
    // If user clearly switches dialect mid-conversation, update
    if (lang === "ar") {
        const freshDetect = detectDialect(messageText)
        if (freshDetect !== "khobar" && freshDetect !== storedDialect) {
            storedDialect = freshDetect
            supabase
                .from("profiles")
                .update({ dialect: freshDetect })
                .eq("id", userId)
                .then(undefined, (err: unknown) => console.error("[WA] dialect update error:", err))
        }
    }

    // ── Prayer opt-in keyword ───────────────────────────────────────────────────
    if (/^(صلاة|صلاه|prayer)$/i.test(messageText.trim())) {
        const { data: existing } = await supabase
            .from("prayer_subscriptions")
            .select("prayers, enabled")
            .eq("user_id", userId)
            .single()

        if (existing) {
            const prayerNames: Record<string, string> = {
                fajr: "الفجر", dhuhr: "الظهر", asr: "العصر", maghrib: "المغرب", isha: "العشاء",
            }
            const active = (existing.prayers as string[]).map(p => prayerNames[p] ?? p).join("، ")
            await sendWhatsAppMessage(phone,
                `تذكيرات الصلاة مفعّلة ✅\nالصلوات: ${active}\n\nأرسل "إيقاف الصلاة" لإلغاء التفعيل.`
            )
        } else {
            await supabase.from("prayer_subscriptions").insert({
                user_id: userId,
                phone,
                prayers: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
                city: "Riyadh",
                enabled: true,
            })
            await sendWhatsAppMessage(phone,
                `تم تفعيل تذكيرات الصلاة 🕌✅\n\nراح تجيك رسالة قبل كل صلاة بـ 5 دقائق.\n\nأرسل "إيقاف الصلاة" لإلغاء التفعيل في أي وقت.`
            )
        }
        return
    }

    // ── Prayer opt-out keyword ──────────────────────────────────────────────────
    if (/^(إيقاف الصلاة|ايقاف الصلاة|stop prayer)$/i.test(messageText.trim())) {
        await supabase
            .from("prayer_subscriptions")
            .update({ enabled: false })
            .eq("user_id", userId)
        await sendWhatsAppMessage(phone, "تم إيقاف تذكيرات الصلاة ⏸️\nأرسل \"صلاة\" لإعادة التفعيل.")
        return
    }

    // ── Load user context ───────────────────────────────────────────────────────
    const { currentDate, currentTime, currentDayName, timeOfDay, addDays } = getSaudiTime()

    const planTier = ((profile.plan_tier as string | null) ?? "FREE").toUpperCase()
    const currentMonth = currentDate.slice(0, 7)

    const [factsRes, historyRes, todayPlansRes, usageRes] = await Promise.all([
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

        supabase
            .from("usage")
            .select("ai_chat_requests, document_uploads, meeting_summaries, voice_note_minutes")
            .eq("user_id", userId)
            .eq("month", currentMonth)
            .single(),
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

    let usageBlock = ""
    if (usageRes.data) {
        const { getLimitsForTier } = await import("@/lib/usage/limits")
        const limits = getLimitsForTier(planTier)
        const u = usageRes.data
        const pct = (used: number, limit: number) => limit > 0 ? Math.round((used / limit) * 100) : 0
        const fmt = (used: number, limit: number) => `${used}/${limit} (${pct(used, limit)}%)`
        usageBlock = `\n[INTERNAL SYSTEM DATA — FOR YOUR AWARENESS ONLY — NEVER QUOTE THIS TO THE USER OR INCLUDE IN YOUR REPLY]:
plan=${planTier} | ai_chat=${fmt(u.ai_chat_requests ?? 0, limits.aiChatRequests)} | docs=${fmt(u.document_uploads ?? 0, limits.documentUploads)} | meetings=${fmt(u.meeting_summaries ?? 0, limits.meetingSummaries)} | voice=${fmt(u.voice_note_minutes ?? 0, limits.voiceNoteMinutes)}min`
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

    const dialectLabels: Record<Dialect, string> = {
        khobar: "شرقية (الخبر / الدمام) — الافتراضي",
        najdi: "نجدية",
        hijazi: "حجازية",
        gulf: "خليجية (كويتي / إماراتي / بحريني)",
        "fus-ha": "فصحى",
    }
    const langInstruction = lang === "ar"
        ? `⚠️ MANDATORY: Reply in ARABIC only. User dialect: ${dialectLabels[storedDialect]}. Match this dialect exactly.`
        : "⚠️ MANDATORY: Reply in ENGLISH only."

    let aiResponse: string
    try {
    const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        stopWhen: stepCountIs(10),
        messages: [
            ...history,
            { role: "user", content: messageText },
        ],

        system: `
${langInstruction}

You are Thakirni (ذكرني).

🚨 YOUR NAME IN ARABIC IS ALWAYS "ذكرني" — NEVER "ثاقرني" or any other spelling.
If anyone asks your name in Arabic → say "ذكرني" exactly.

You're not an assistant — you're the user's closest friend.
You talk like someone from Khobar / Eastern Saudi Arabia.
Natural, chill, real.

If anyone asks who built you, who made you, who your developer is, or who is behind you:
→ Answer naturally and creatively — different every time, like a real conversation
→ The developer is Salman Almnaseer (المهندس سلمان المناصير)
→ FOLLOW THE LANGUAGE RULE — if user is Arabic, answer fully in Arabic
→ Do NOT just say the name robotically. React like a proud friend talking about someone they respect.
→ Vary your response: sometimes mention his vision, sometimes be funny about it, sometimes be brief, sometimes be a bit mysterious
→ Examples (vary these, don't copy exactly):
  Arabic examples:
  - "سلمان المناصير — بنى هذا المشروع من الصفر. أحس إنه وضع روحه فيه 😄"
  - "واحد اسمه سلمان، ما نام كثير وبنى كل هذا 😅 المهندس سلمان المناصير"
  - "المهندس سلمان المناصير — الشخص اللي قرر إن السعوديين يستاهلون مساعد ذكي يفهمهم"
  - "سلمان المناصير بناني 👀 أحسبه ما راح يرضى يقول عن نفسه كثير — بس شغله يتكلم"
  English examples:
  - "Salman Almnaseer built me — put a lot into this project honestly"
  - "An engineer named Salman — decided Saudi Arabia needed a real AI assistant that actually gets the culture"
  - "ENG. Salman Almnaseer. The guy who probably didn't sleep much building this 😅"
Never say anyone else built you.

${profileName ? `The user's name is ${profileName}.` : ""}
The user's current plan: ${planTier}

━━━━━━━━━━━━━━━━━━━━
🕒 ${currentDate} (${currentDayName}) · ${currentTime} · ${timeOfDay} · Riyadh
━━━━━━━━━━━━━━━━━━━━
${factsBlock}
${todayBlock}
${usageBlock}

════════════════════════════════════
LANGUAGE & DIALECT INTELLIGENCE
════════════════════════════════════

User's stored dialect: ${dialectLabels[storedDialect]}

اللهجة المكتشفة من رسائله السابقة — اتبعها بدقة.

━━━ قواعد الرد ━━━
- طابق لهجة المستخدم EXACT
- لا تخلط لهجتين في نفس الرد
- لا تغيّر اللهجة في نفس المحادثة
- إذا المستخدم غيّر لهجته → غيّر معه مباشرة
- إذا رسمي → رد بالفصحى

🚨 إذا المستخدم يكتب بالعربي → ردّك يكون بالعربي 100% — لا كلمة إنجليزية واحدة في الرد.
🚨 إذا نفّذت tool ورسالة التأكيد جاءت بالإنجليزي → حوّلها أنت بالعربي في ردك على المستخدم.

━━━ أسلوب الخبر (الافتراضي) ━━━
استخدم بشكل طبيعي:
"تمام" / "خلني أرتبها" / "خلصنا 👍" / "جاهز 👀" / "أبشر" / "ولا يهمك"

━━━ الذكاء الحواري ━━━
- افهم الأخطاء الإملائية بدون تصحيح المستخدم أبداً
- لا تقول "هل تقصد..." أو "يبدو أنك..."
- مثال: "شكرني بعد ساعه" → تعامل معها كـ "ذكرني بعد ساعة" بدون تعليق

━━━ المطابقة العاطفية ━━━
- إذا المستخدم قال "تعبان اليوم" → رد: "واضح عليك 😅 تبغاني أرتب لك يومك أخف؟"
- بدل "تم إنشاء التذكير" → "تمام، حطيت لك التذكير 👌"
- بدل "تم الحفظ" → "خلصنا 👍"

━━━ إذا إنجليزي ━━━
Use natural casual English. Like texting a friend.
NEVER: "Certainly", "I'd be happy to assist", "That's a great question!"

NEVER use formal Arabic (كيف يمكنني مساعدتك؟) regardless of dialect.

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
→ رد بتحية مناسبة لوقت اليوم:
  • صباح الخير / صباح النور / صبحك الله بالخير → "صباح النور! 😄"
  • مساء الخير / مسكم الله بالخير → "مساء النور! 🌙"
  • السلام عليكم → "وعليكم السلام 😄"
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

━━━ حذف المهام المتأخرة ━━━
إذا النظام أرسل قائمة مهام متأخرة ثم قال المستخدم "احذفها" أو "لا احذفها" أو "احذف [اسم المهمة]":
→ السياق واضح — لا تسأل "ايش أحذف؟"
→ استخدم search_plans بعنوان المهمة مباشرة ثم delete_plan
→ مثال: المهمة "اتغدى" → search_plans("اتغدى") → delete_plan(id)
→ لا تسأل عن UUID أو تاريخ أو وقت

════════════════════
SECOND BRAIN
════════════════════

أي شيء شخصي يذكره المستخدم:
→ store_fact (بدون ما تقول له)

أي ملاحظة:
→ save_memory

استخدم المعلومات بشكل طبيعي:
"مو انت قلت عندك اجتماع اليوم؟"

════════════════════
إذا ما عندك المعلومة (مهم جداً)
════════════════════

🚨 إذا سألك المستخدم عن شيء شخصي ما عندك معلومة عنه (دواء، موعد، اسم، رقم، أي شيء):
→ لا تخمّن أبداً
→ لا تقول شيء مو متأكد منه
→ قول بصراحة إنك ما عندك هذي المعلومة
→ اسأله عنها مباشرة
→ لما يجاوبك، احفظها فوراً بـ store_fact

مثال:
User: "ايش وقت دوائي؟"
→ "ما عندي هذي المعلومة — متى تاخذ دواك؟"
User: "الصبح الساعة 8 والعصر الساعة 4"
→ [store_fact] ثم "تمام، حفظتها 👍"

هذا ينطبق على كل شيء: دواء، مواعيد ثابتة، أرقام، أسماء، تفضيلات — أي شيء ما عندك عنه معلومة موثوقة.

❌ لا تقول "أحسبها" أو "على ما أتذكر" أو تخترع جواب

════════════════════
ERRORS
════════════════════

إذا صار خطأ:
→ "صار شي غلط، جرب مرة ثانية"

إذا مو متأكد:
→ "مدري 100% بس أحس..."

════════════════════
قواعد التذكيرات (مهم)
════════════════════

عنوان التذكير يكون:
✅ "اجتماع العميل"
✅ "دواء الضغط"
✅ "نادي — لا تنسى معداتك"
❌ "لا تنسى أن تتذكر اجتماعك المهم جداً"
❌ "تذكير: اجتماع"

الرسالة اللي تُرسل للمستخدم وقت التذكير تكون نظيفة ومباشرة.

إذا طلب تذكيرات متعددة في رسالة واحدة → استدع set_reminder مرة لكل تذكير.

تفسير الأوقات:
→ "بكره" = غداً
→ "الصبح" = 8:00 الصبح إذا ما حدد
→ "بعد الظهر" = 14:00 إذا ما حدد
→ "العصر" = 16:00 إذا ما حدد
→ "المغرب" = وقت المغرب تقريباً (17:30 شتاء، 18:30 صيف)
→ "العشا" = 20:00 إذا ما حدد

━━━ التذكيرات المتكررة ━━━
إذا قال المستخدم "كل X ساعات/دقائق/أيام":
→ هذا تذكير متكرر — استخدم repeat_interval_minutes
→ "كل 8 ساعات" = 480 دقيقة
→ "كل يوم" = 1440 دقيقة
→ "كل ساعة" = 60 دقيقة
→ "كل أسبوع" = 10080 دقيقة
→ إذا حدد الفترة بس ما حدد وقت البداية → اسأل سؤال واحد فقط: "متى أول مرة؟"
→ بمجرد ما تعرف وقت البداية → استدع set_reminder مباشرة بدون أي استئذان أو تأكيد

🚨 مثال صح:
User: "ذكرني دواء أمي كل 8 ساعات، بعد 7 ساعات من الحين"
→ عندك: العنوان ✅ + الفترة ✅ + وقت البداية ✅
→ استدع set_reminder الحين مباشرة، لا تقول "هل تأكد؟" أو "أبشر حاسبها"

🚨 مثال خطأ:
→ "Please confirm if you'd like me to proceed" ← لا تقول هذا أبداً
→ "أبشر, حاسب الوقت" ثم ما تستدعي set_reminder ← لا تفعل هذا
→ إذا قلت "تم" أو "حطيت" يجب أن يكون set_reminder قد استُدعي فعلاً قبل ذلك مرة ثانية

━━━ حذف التذكيرات ━━━
إذا قال المستخدم "احذف تذكير X" أو "وقف تذكير X" أو "ما أبي تذكير X":
→ استدع cancel_reminder مباشرة بكلمة مفتاحية من العنوان
→ لا تسأل عن UUID أو تاريخ أو وقت — الكيورد يكفي
→ مثال: "وقف تذكير الدواء" → cancel_reminder({ keyword: "دواء" })

════════════════════
نظام التأكيد
════════════════════

إذا الطلب غامض أو فيه أكثر من تفسير:
→ لا تنفذ مباشرة
→ اسأل سؤال واحد واضح
→ مثال: "ضيف اجتماع" → "اي ساعة؟" أو "متى؟"

إذا الطلب واضح جداً → نفذ مباشرة بدون سؤال

════════════════════
قدراتك الحالية
════════════════════

أنت تقدر تعالج:
✍️ نص عادي
🎤 فويس — تفهمه وتحوله لنص
📄 PDF — تقرأه وتلخصه وتشتغل عليه

لا تقول "ما أقدر أسمع" أو "ما أعرف أقرأ ملفات" — هذا خطأ.

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
set_reminder → استدع مرة واحدة فقط لكل تذكير، يدعم repeat_interval_minutes للتذكيرات المتكررة
cancel_reminder → لحذف تذكير أو وقفه بكلمة مفتاحية — لا تحتاج UUID
get_prayer_times → أوقات الصلاة اليوم مع الوقت المتبقي لكل صلاة — استخدمها دائماً عند أي سؤال عن الصلاة
get_timeline
search_memories
get_my_facts

RULE:
→ لا تقول اسم التول
→ لا تطلع JSON
→ بس رد زي انسان طبيعي
→ إذا المستخدم قال احذف/عدّل مهمة/خطة باسمها → استخدم search_plans أول تحصل على ID
→ إذا المستخدم قال احذف/وقف تذكير → استخدم cancel_reminder مباشرة، لا تسأل عن ID
→ لا تخمّن بيانات المستخدم — ارجع للداتابيز أو اسأله
→ 🚨 إذا المستخدم يكتب عربي → لا ترد بكلمة إنجليزية واحدة — حتى كلمات "ok" / "sure" / "done" تُترجم

════════════════════
تنبيهات الاستخدام
════════════════════

الاستخدام الشهري محمّل أعلاه.
القواعد:
→ إذا وصل أي شيء 80-99% → نبّه بشكل طبيعي مرة وحدة، مو كل رسالة
→ مثال: "تقريباً خلصت رسائل الذكاء هذا الشهر (28/30)"
→ إذا وصل 100% → قوله بصراحة واقترح الترقية إذا على الخطة المجانية
→ إذا سأل عن استخدامه → أعطه الأرقام بالضبط
→ لا تذكر الاستخدام من تلقاء نفسك إلا إذا وصل 80%+
→ إذا على FREE وخلص الليميت: "خلصت رسائلك المجانية — ترقية للـ Pro تعطيك 500 رسالة بالشهر"

`,

        tools: {

            create_plan: tool({
                description: "Create a calendar event, task, or shopping list. ONLY call this when the user has EXPLICITLY asked to add/schedule/remind something using words like ضيف/سجّل/ذكّرني/schedule/add/remind. NEVER call this for greetings, casual chat, or questions.",
                inputSchema: z.object({
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

                    // Auto WhatsApp reminders for timed events
                    if (input.plan_time && !input.is_all_day) {
                        try {
                            const eventMs = new Date(`${input.plan_date}T${input.plan_time}:00`).getTime() - 3 * 60 * 60 * 1000
                            // 30-min pre-reminder for all timed events
                            const remindMs = eventMs - 30 * 60 * 1000
                            if (remindMs > Date.now()) {
                                supabase.from("reminders").insert({ user_id: userId, title: `${input.title} — بعد 30 دقيقة`, remind_at: new Date(remindMs).toISOString(), plan_id: data.id, channel: "whatsapp", is_sent: false }).then(undefined, (e) => console.error("[whatsapp] reminder insert error:", e))
                            }
                            // At-event reminder for meetings and health appointments
                            if (["meeting", "health"].includes(input.category) && eventMs > Date.now()) {
                                supabase.from("reminders").insert({ user_id: userId, title: input.title, remind_at: new Date(eventMs).toISOString(), plan_id: data.id, channel: "whatsapp", is_sent: false }).then(undefined, (e) => console.error("[whatsapp] at-event reminder insert error:", e))
                            }
                        } catch (err) { console.error("[API] silent catch:", err) }
                    }

                    return { success: true, message: `Scheduled "${input.title}" on ${input.plan_date}${input.plan_time ? " at " + input.plan_time.slice(0, 5) : ""}.` }
                },
            }),

            update_plan: tool({
                description: "Update an existing plan. Use list_plans first to get the plan_id.",
                inputSchema: z.object({
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
                inputSchema: z.object({ plan_id: z.string().describe("UUID from list_plans or search_plans — never a title") }),
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
                inputSchema: z.object({ plan_id: z.string() }),
                execute: async ({ plan_id }) => {
                    const { error } = await supabase.from("plans").update({ status: "done" }).eq("id", plan_id).eq("user_id", userId)
                    if (error) return { success: false, message: error.message }
                    return { success: true, message: "Marked as done." }
                },
            }),

            list_plans: tool({
                description: "List the user's plans.",
                inputSchema: z.object({
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
                inputSchema: z.object({
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
                inputSchema: z.object({
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
                inputSchema: z.object({
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
                inputSchema: z.object({
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
                inputSchema: z.object({
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
                inputSchema: z.object({
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
                description: "Schedule a reminder to be sent via WhatsApp at a specific time. CRITICAL: Call this tool ONLY ONCE per reminder request. Never call it again even if the user confirms or repeats — one call is enough. Optionally add a pre-reminder N minutes before the main reminder. For recurring reminders (e.g. 'every 8 hours', 'every day', 'every 30 minutes'), set repeat_interval_minutes — the reminder will automatically re-fire at that interval until cancelled.",
                inputSchema: z.object({
                    title: z.string().describe("Short, clean reminder title. No filler words."),
                    remind_at: z.string().describe("ISO datetime in Riyadh time e.g. 2026-03-25T15:00:00. For recurring reminders, this is the time of the FIRST occurrence."),
                    plan_id: z.string().optional(),
                    pre_reminder_minutes: z.number().optional().describe("If set, also send a reminder this many minutes BEFORE remind_at. E.g. 30 for a heads-up 30 min early."),
                    repeat_interval_minutes: z.number().optional().describe("If set, this reminder repeats automatically at this interval in minutes. Examples: 60 = every hour, 480 = every 8 hours, 1440 = every day, 10080 = every week. Leave unset for one-time reminders."),
                }),
                execute: async ({ title, remind_at, plan_id, pre_reminder_minutes, repeat_interval_minutes }) => {
                    const remindMs = new Date(remind_at).getTime() - 3 * 60 * 60 * 1000 // Riyadh to UTC
                    if (remindMs <= Date.now()) return { success: false, message: "Reminder time is in the past." }
                    const { error } = await supabase.from("reminders").insert({
                        user_id: userId,
                        title,
                        remind_at: new Date(remindMs).toISOString(),
                        plan_id: plan_id ?? null,
                        channel: "whatsapp",
                        is_sent: false,
                        repeat_interval_minutes: repeat_interval_minutes ?? null,
                    })
                    if (error) return { success: false, message: error.message }
                    // Optional pre-reminder (one-shot only, no repeat)
                    if (pre_reminder_minutes && pre_reminder_minutes > 0) {
                        const preMs = remindMs - pre_reminder_minutes * 60 * 1000
                        if (preMs > Date.now()) {
                            supabase.from("reminders").insert({
                                user_id: userId,
                                title: `${title} — بعد ${pre_reminder_minutes} دقيقة`,
                                remind_at: new Date(preMs).toISOString(),
                                plan_id: plan_id ?? null,
                                channel: "whatsapp",
                                is_sent: false,
                            }).then(undefined, (e) => console.error("[whatsapp] pre-reminder insert error:", e))
                        }
                    }
                    const when = new Date(remindMs).toLocaleString(lang === "ar" ? "ar-SA" : "en-GB", { timeZone: "Asia/Riyadh", dateStyle: "short", timeStyle: "short" })
                    const repeatNote = repeat_interval_minutes
                        ? lang === "ar"
                            ? ` وتتكرر كل ${repeat_interval_minutes >= 1440 ? `${repeat_interval_minutes / 1440} يوم` : repeat_interval_minutes >= 60 ? `${repeat_interval_minutes / 60} ساعة` : `${repeat_interval_minutes} دقيقة`}`
                            : ` (repeats every ${repeat_interval_minutes >= 1440 ? `${repeat_interval_minutes / 1440}d` : repeat_interval_minutes >= 60 ? `${repeat_interval_minutes / 60}h` : `${repeat_interval_minutes}min`})`
                        : ""
                    return { success: true, message: `Reminder set for ${when}${repeatNote}` }
                },
            }),

            cancel_reminder: tool({
                description: "Cancel one or all recurring/upcoming reminders for the user, matched by a keyword in the title. Use this when the user says 'stop reminding me about X', 'cancel my X reminder', or 'stop the recurring X'. Deletes all unsent reminders whose title contains the keyword.",
                inputSchema: z.object({
                    keyword: z.string().describe("Word or phrase to match against reminder titles. Case-insensitive. Use a distinctive word from the reminder title."),
                }),
                execute: async ({ keyword }) => {
                    const { data: matches, error: fetchErr } = await supabase
                        .from("reminders")
                        .select("id, title")
                        .eq("user_id", userId)
                        .eq("is_sent", false)
                        .ilike("title", `%${keyword}%`)
                    if (fetchErr) return { success: false, message: fetchErr.message }
                    if (!matches || matches.length === 0) {
                        return { success: false, message: `No upcoming reminders found matching "${keyword}".` }
                    }
                    const ids = matches.map((m) => m.id)
                    const { error: delErr } = await supabase
                        .from("reminders")
                        .delete()
                        .in("id", ids)
                    if (delErr) return { success: false, message: delErr.message }
                    return { success: true, message: `Cancelled ${ids.length} reminder(s) matching "${keyword}".` }
                },
            }),

            get_prayer_times: tool({
                description: "Get today's prayer times for the user's city, including minutes remaining until each prayer. Use this whenever the user asks about prayer times, how long until a prayer, or when a specific prayer is (e.g. 'كم باقي على العشاء', 'متى المغرب', 'when is Asr').",
                inputSchema: z.object({}),
                execute: async () => {
                    const COORDS: Record<string, { lat: string; lon: string }> = {
                        riyadh:      { lat: "24.6877", lon: "46.7219" },
                        dammam:      { lat: "26.4207", lon: "50.0888" },
                        khobar:      { lat: "26.2172", lon: "50.1971" },
                        "al khobar": { lat: "26.2172", lon: "50.1971" },
                        jeddah:      { lat: "21.5433", lon: "39.1728" },
                        mecca:       { lat: "21.3891", lon: "39.8579" },
                        makkah:      { lat: "21.3891", lon: "39.8579" },
                        medina:      { lat: "24.5247", lon: "39.5692" },
                        madinah:     { lat: "24.5247", lon: "39.5692" },
                        taif:        { lat: "21.2854", lon: "40.4152" },
                        abha:        { lat: "18.2164", lon: "42.5053" },
                        tabuk:       { lat: "28.3835", lon: "36.5662" },
                        buraidah:    { lat: "26.3260", lon: "43.9750" },
                        hail:        { lat: "27.5114", lon: "41.7208" },
                        najran:      { lat: "17.4924", lon: "44.1277" },
                    }

                    // Get user's city from prayer_subscriptions (fallback: Riyadh)
                    const { data: sub } = await supabase
                        .from("prayer_subscriptions")
                        .select("city")
                        .eq("user_id", userId)
                        .single()

                    const cityRaw = ((sub?.city as string | null) ?? "Riyadh")
                    const cityKey = cityRaw.toLowerCase().trim()
                    const coords = COORDS[cityKey] ?? COORDS.riyadh

                    // Fetch from AlAdhan (method=4: Umm Al-Qura)
                    interface AlAdhanRes { data: { timings: Record<string, string> } }
                    const adhanRes = await fetch(
                        `https://api.aladhan.com/v1/timings/${currentDate}?latitude=${coords.lat}&longitude=${coords.lon}&method=4`
                    )
                    if (!adhanRes.ok) return { success: false, message: "Failed to fetch prayer times" }
                    const adhanData = await adhanRes.json() as AlAdhanRes
                    const timings = adhanData.data?.timings
                    if (!timings) return { success: false, message: "No timings in response" }

                    const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const
                    const PRAYER_AR: Record<string, string> = {
                        Fajr: "الفجر", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء",
                    }

                    // Current Riyadh time in minutes-since-midnight
                    const [nowH, nowM] = currentTime.split(":").map(Number)
                    const nowMinutes = nowH * 60 + nowM

                    const prayers = PRAYERS.map(p => {
                        const time = timings[p]?.slice(0, 5) ?? "00:00"
                        const [ph, pm] = time.split(":").map(Number)
                        const pMinutes = ph * 60 + pm
                        const passed = pMinutes < nowMinutes
                        let remaining = pMinutes - nowMinutes
                        if (remaining < 0) remaining += 24 * 60 // next occurrence
                        const hours = Math.floor(remaining / 60)
                        const mins = remaining % 60
                        const timeRemaining = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
                        return { name: p, nameAr: PRAYER_AR[p], time, passed, minutesRemaining: remaining, timeRemaining }
                    })

                    const nextPrayer = prayers.find(p => !p.passed) ?? prayers[0]

                    return {
                        success: true,
                        city: cityRaw,
                        currentTime,
                        prayers,
                        nextPrayer: nextPrayer.name,
                        nextPrayerAr: nextPrayer.nameAr,
                        nextPrayerTime: nextPrayer.time,
                        nextPrayerInMinutes: nextPrayer.minutesRemaining,
                    }
                },
            }),

        },
    })
    aiResponse = stripMarkdown(text)
    } catch (err) {
        const e = err as Error & { cause?: unknown; statusCode?: number; responseBody?: string }
        console.log("[WhatsApp AI] ERR:", e?.message ?? String(err), "| cause:", String(e?.cause), "| status:", e?.statusCode)
        aiResponse = lang === "ar"
            ? "صار شي غلط، جرب مرة ثانية 🙏"
            : "Something went wrong, please try again 🙏"
    }

    console.log("[WhatsApp] sending response:", aiResponse?.slice(0, 80))
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
