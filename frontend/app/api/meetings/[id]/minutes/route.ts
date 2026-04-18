import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"

export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const rl = await limiters.api(auth.userId)
  if (!rl.success) return rateLimitResponse(rl.reset)

  const { id } = await params

  // Fetch the meeting
  const { data: meeting, error } = await auth.supabase
    .from("meetings")
    .select("id, title, duration_seconds, speaker_count, language, summary, key_points, action_items, speakers, transcript, created_at")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .single()

  if (error || !meeting) {
    return Response.json({ error: "Meeting not found" }, { status: 404 })
  }

  const { language: reqLang } = await req.json().catch(() => ({})) as { language?: string }
  const outputLang: "ar" | "en" = reqLang === "ar" ? "ar" : "en"

  // Format duration
  const durationSecs = meeting.duration_seconds as number | null
  const durationStr = durationSecs
    ? `${Math.floor(durationSecs / 60)}m ${Math.floor(durationSecs % 60)}s`
    : "Unknown"

  // Format date
  const meetingDate = new Date(meeting.created_at as string).toLocaleDateString(
    outputLang === "ar" ? "ar-SA" : "en-GB",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  )
  const meetingTime = new Date(meeting.created_at as string).toLocaleTimeString(
    outputLang === "ar" ? "ar-SA" : "en-GB",
    { hour: "2-digit", minute: "2-digit" }
  )

  // Build speaker list
  const speakers = meeting.speakers as Record<string, string> | null
  const speakerList = speakers && Object.keys(speakers).length > 0
    ? Object.entries(speakers).map(([key, name]) => name !== key ? `${name} (${key})` : key).join(", ")
    : `${meeting.speaker_count ?? 1} ${outputLang === "ar" ? "متحدث" : "participant(s)"}`

  // Build key points block
  const keyPoints = (meeting.key_points as string[] | null) ?? []
  const keyPointsBlock = keyPoints.length > 0
    ? keyPoints.map((pt, i) => `${i + 1}. ${pt}`).join("\n")
    : outputLang === "ar" ? "لا توجد نقاط مسجلة" : "No key points recorded"

  // Build action items block
  const actionItems = (meeting.action_items as string[] | null) ?? []
  const actionBlock = actionItems.length > 0
    ? actionItems.map((item) => `- ${item}`).join("\n")
    : outputLang === "ar" ? "لا توجد مهام" : "No action items"

  // Build transcript excerpt (first 20 segments, max)
  type TranscriptSeg = { start: number; end: number; text: string; speaker?: string }
  const transcript = (meeting.transcript as TranscriptSeg[] | null) ?? []
  const transcriptBlock = transcript.length > 0
    ? transcript
        .slice(0, 20)
        .map(seg => `[${seg.speaker ?? "Speaker"}]: ${seg.text}`)
        .join("\n")
    : ""

  const systemPrompt = outputLang === "ar"
    ? `أنت محترف في كتابة محاضر الاجتماعات. مهمتك تحويل بيانات الاجتماع إلى محاضر رسمية باللغة العربية بتنسيق نظيف ومنظم. اكتب بالعربية الفصحى الرسمية.`
    : `You are a professional meeting minutes writer. Your task is to transform meeting data into formal, well-structured meeting minutes in clean professional English.`

  const userPrompt = outputLang === "ar"
    ? `
حوّل بيانات الاجتماع التالية إلى محاضر رسمية منظمة:

العنوان: ${meeting.title}
التاريخ: ${meetingDate}
الوقت: ${meetingTime}
المدة: ${durationStr}
المشاركون: ${speakerList}

الملخص:
${meeting.summary ?? "لا يوجد ملخص"}

النقاط الرئيسية:
${keyPointsBlock}

مهام المتابعة:
${actionBlock}

${transcriptBlock ? `مقتطف من النص:\n${transcriptBlock}` : ""}

اكتب المحاضر الرسمية بهذا الهيكل:
1. معلومات الاجتماع (العنوان، التاريخ، الوقت، المدة، الحضور)
2. ملخص تنفيذي
3. النقاط الرئيسية التي تمت مناقشتها
4. القرارات المتخذة (استنتج من السياق)
5. مهام المتابعة مع المسؤولين إن أمكن
6. الخاتمة

اكتب بأسلوب رسمي ومهني. لا تضف معلومات غير موجودة في البيانات المعطاة.
`
    : `
Transform the following meeting data into formal meeting minutes:

Title: ${meeting.title}
Date: ${meetingDate}
Time: ${meetingTime}
Duration: ${durationStr}
Attendees: ${speakerList}

Summary:
${meeting.summary ?? "No summary available"}

Key Points:
${keyPointsBlock}

Action Items:
${actionBlock}

${transcriptBlock ? `Transcript excerpt:\n${transcriptBlock}` : ""}

Write formal meeting minutes with this structure:
1. Meeting Information (title, date, time, duration, attendees)
2. Executive Summary
3. Key Points Discussed
4. Decisions Made (infer from context where reasonable)
5. Action Items with owners if identifiable
6. Adjournment / Next Steps

Use formal professional language. Do not fabricate information not present in the data provided.
`

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set")

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 2000 },
    }

    const RETRYABLE = new Set([429, 503])
    let lastErr: Error = new Error("Gemini request failed")
    let text: string | undefined

    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, Math.min(4000 * 2 ** (attempt - 1), 30000)))
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      )
      if (!res.ok) {
        const errText = await res.text().catch(() => "")
        lastErr = new Error(`Gemini generateContent failed (${res.status}): ${errText}`)
        if (RETRYABLE.has(res.status)) continue
        throw lastErr
      }
      interface GeminiRes { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
      const data = await res.json() as GeminiRes
      text = data.candidates?.[0]?.content?.parts?.[0]?.text
      break
    }

    if (!text) throw lastErr

    return Response.json({
      minutes: text,
      meta: {
        title: meeting.title,
        date: meetingDate,
        time: meetingTime,
        duration: durationStr,
        attendees: speakerList,
        language: outputLang,
      }
    })
  } catch (err) {
    console.error("[meetings/minutes] generation error:", err)
    const msg = err instanceof Error ? err.message : "Failed to generate minutes"
    return Response.json({ error: msg }, { status: 500 })
  }
}
