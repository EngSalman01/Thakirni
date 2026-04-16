import { getGoogle } from "./ai.service"
import { generateText } from "ai"
import path from "path"

export interface TranscriptSegment {
  id: number
  start: number
  end: number
  text: string
  speaker?: string
}

export interface MeetingSummary {
  transcript: TranscriptSegment[]
  speakers: Record<string, string>
  summary: string
  actionItems: string[]
  keyPoints: string[]
  duration: number
  language: "ar" | "en"
}

const MIME_MAP: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
  ".mp4": "video/mp4",
}

/**
 * Single-pass processing: send audio once to Gemini and get back
 * transcript + speaker IDs + summary + key points + action items.
 * This avoids 3 sequential API calls and easily fits within 300s.
 */
export async function processMeetingRecording(
  audioBuffer: Buffer,
  filename: string,
  options: { language?: string; meetingTitle?: string; outputLanguage?: "ar" | "en" } = {}
): Promise<MeetingSummary> {
  const ext = path.extname(filename).toLowerCase()
  const mimeType = MIME_MAP[ext] ?? "audio/mpeg"
  const outputLang = options.outputLanguage ?? "ar"
  const titleNote = options.meetingTitle ? ` for "${options.meetingTitle}"` : ""

  const prompt = outputLang === "ar"
    ? `أنت مساعد اجتماعات ذكي. استمع للتسجيل الصوتي${titleNote} وقم بما يلي في استجابة JSON واحدة:

1. فرّغ النص كاملاً مع تحديد المتحدثين والأوقات التقريبية
2. عرّف المتحدثين المختلفين (Speaker 1، Speaker 2، ...) وإذا ذُكر اسم أحدهم استخدمه
3. اكتب ملخصاً شاملاً للاجتماع (2-3 فقرات)
4. استخرج النقاط الرئيسية
5. استخرج مهام المتابعة

أرجع JSON فقط بهذا الشكل EXACTLY:
{
  "transcript": [
    {"id": 0, "start": 0.0, "end": 5.0, "text": "النص هنا", "speaker": "Speaker 1"},
    ...
  ],
  "speakers": {"Speaker 1": "الاسم إن وُجد", "Speaker 2": "..."},
  "summary": "ملخص مفصل...",
  "keyPoints": ["نقطة 1", "نقطة 2", ...],
  "actionItems": ["مهمة 1 - المسؤول إن ذُكر", ...]
}
JSON فقط، بدون أي نص خارج الـ JSON.`
    : `You are an expert meeting assistant. Listen to this audio recording${titleNote} and do the following in a single JSON response:

1. Transcribe the full audio with speaker identification and approximate timestamps
2. Identify distinct speakers (Speaker 1, Speaker 2, ...) — use actual names if mentioned
3. Write a comprehensive meeting summary (2-3 paragraphs)
4. Extract key discussion points
5. Extract action items with owners where identifiable

Return ONLY valid JSON in this EXACT structure:
{
  "transcript": [
    {"id": 0, "start": 0.0, "end": 5.0, "text": "text here", "speaker": "Speaker 1"},
    ...
  ],
  "speakers": {"Speaker 1": "name if known", "Speaker 2": "..."},
  "summary": "detailed summary...",
  "keyPoints": ["Point 1", "Point 2", ...],
  "actionItems": ["Action item with owner if mentioned", ...]
}
JSON only — no text outside the JSON block.`

  const { text } = await generateText({
    model: getGoogle()("gemini-2.5-flash"),
    messages: [{
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "file", data: audioBuffer, mediaType: mimeType },
      ],
    }],
    maxOutputTokens: 8000,
  })

  // Parse the JSON response
  let parsed: {
    transcript?: TranscriptSegment[]
    speakers?: Record<string, string>
    summary?: string
    keyPoints?: string[]
    actionItems?: string[]
  } = {}

  try {
    // Find the outermost JSON object using brace counting (avoids greedy regex issues)
    const start = text.indexOf("{")
    if (start !== -1) {
      let depth = 0
      let end = -1
      for (let i = start; i < text.length; i++) {
        if (text[i] === "{") depth++
        else if (text[i] === "}") { depth--; if (depth === 0) { end = i; break } }
      }
      if (end !== -1) parsed = JSON.parse(text.slice(start, end + 1))
    }
  } catch {
    console.error("[transcription] JSON parse failed, using raw text as summary")
    parsed = { summary: text, transcript: [], speakers: {}, keyPoints: [], actionItems: [] }
  }

  const transcript: TranscriptSegment[] = Array.isArray(parsed.transcript) ? parsed.transcript : []
  const speakers: Record<string, string> = (parsed.speakers && typeof parsed.speakers === "object") ? parsed.speakers : {}
  const duration = transcript.length > 0 ? transcript[transcript.length - 1].end : 0
  const hasArabic = transcript.some(s => /[\u0600-\u06FF]/.test(s.text))

  return {
    transcript,
    speakers,
    summary: parsed.summary ?? "",
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    duration,
    language: hasArabic ? "ar" : "en",
  }
}

// Keep these exports for backward compatibility with any other callers
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  language?: string
): Promise<TranscriptSegment[]> {
  const result = await processMeetingRecording(audioBuffer, filename, { language })
  return result.transcript
}

export async function generateMeetingSummary(
  segments: TranscriptSegment[],
  speakers: Record<string, string>,
  language: "ar" | "en" = "en",
  meetingTitle?: string
): Promise<{ summary: string; actionItems: string[]; keyPoints: string[] }> {
  const { generateText: gen } = await import("ai")
  const namedTranscript = segments.map(s => `${s.speaker ?? "Unknown"}: ${s.text}`).join("\n")
  const prompt = language === "ar"
    ? `ملخص الاجتماع${meetingTitle ? ` "${meetingTitle}"` : ""}:\n\n${namedTranscript}\n\nأرجع JSON:\n{"summary":"...","keyPoints":["..."],"actionItems":["..."]}`
    : `Meeting${meetingTitle ? ` "${meetingTitle}"` : ""}:\n\n${namedTranscript}\n\nReturn JSON:\n{"summary":"...","keyPoints":["..."],"actionItems":["..."]}`

  const { text } = await gen({ model: getGoogle()("gemini-2.5-flash"), prompt })
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON")
    return JSON.parse(match[0])
  } catch {
    return { summary: text, keyPoints: [], actionItems: [] }
  }
}
