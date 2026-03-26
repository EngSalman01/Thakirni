import { getAiModel, getGoogle } from "./ai.service"
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

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  language?: string
): Promise<TranscriptSegment[]> {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
    ".m4a": "audio/mp4", ".flac": "audio/flac", ".webm": "audio/webm",
  }
  const mimeType = mimeTypes[ext] ?? "audio/mpeg"
  const langInstruction = language ? `The audio is in ${language}.` : ""

  const { text } = await generateText({
    model: getGoogle()("gemini-flash-latest"),
    messages: [{
      role: "user",
      content: [
        {
          type: "text",
          text: `Transcribe this audio file accurately. ${langInstruction}
Return ONLY a JSON array of transcript segments:
[{"id": 0, "start": 0.0, "end": 5.0, "text": "..."}, ...]
Estimate timestamps based on audio duration. JSON only, no explanation.`,
        },
        { type: "file", data: audioBuffer, mimeType },
      ],
    }],
  })

  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return [{ id: 0, start: 0, end: 0, text: text.trim() }]
    return JSON.parse(match[0])
  } catch {
    return [{ id: 0, start: 0, end: 0, text: text.trim() }]
  }
}

export async function identifySpeakers(
  segments: TranscriptSegment[],
  language: "ar" | "en" = "en"
): Promise<{ segments: TranscriptSegment[]; speakers: Record<string, string> }> {
  if (!segments.length) return { segments, speakers: {} }

  const transcriptText = segments
    .map((s) => `[${formatTime(s.start)}-${formatTime(s.end)}] ${s.text}`)
    .join("\n")

  const prompt = language === "ar"
    ? `أنت خبير في تحليل المحادثات الصوتية. التالي نص من اجتماع:\n\n${transcriptText}\n\nالمطلوب:\n1. حدد المتحدثين (Speaker 1, Speaker 2, ...) بناءً على تغيير المتحدث في السياق والأسلوب\n2. إذا ذُكر اسم شخص في النص، استخدم الاسم بدلاً من Speaker X\n3. أرجع JSON فقط بالشكل التالي:\n{\n  "speakers": {"Speaker 1": "اسم إن وُجد", "Speaker 2": "..."},\n  "segments": [{"id": 0, "speaker": "Speaker 1"}, ...]\n}\nفقط JSON، بدون شرح.`
    : `You are an expert at analyzing conversation transcripts. Here is a meeting transcript:\n\n${transcriptText}\n\nTask:\n1. Identify speakers (Speaker 1, Speaker 2, ...) based on context, speaking style, and conversation flow\n2. If a name is mentioned in the text, use that name instead of Speaker X\n3. Return ONLY valid JSON:\n{\n  "speakers": {"Speaker 1": "name if detected", "Speaker 2": "..."},\n  "segments": [{"id": 0, "speaker": "Speaker 1"}, ...]\n}\nJSON only, no explanation.`

  try {
    const { text } = await generateText({ model: getAiModel(), prompt })
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON in response")

    const parsed = JSON.parse(match[0]) as {
      speakers: Record<string, string>
      segments: Array<{ id: number; speaker: string }>
    }

    const speakerMap = new Map(parsed.segments.map((s) => [s.id, s.speaker]))
    const updatedSegments = segments.map((seg) => ({
      ...seg,
      speaker: speakerMap.get(seg.id) ?? "Unknown",
    }))

    const speakers: Record<string, string> = {}
    for (const [key, name] of Object.entries(parsed.speakers)) {
      speakers[key] = name && name !== key ? name : key
    }

    return { segments: updatedSegments, speakers }
  } catch {
    const updatedSegments = segments.map((seg, i) => ({
      ...seg,
      speaker: `Speaker ${(i % 2) + 1}`,
    }))
    return { segments: updatedSegments, speakers: {} }
  }
}

export async function generateMeetingSummary(
  segments: TranscriptSegment[],
  speakers: Record<string, string>,
  language: "ar" | "en" = "en",
  meetingTitle?: string
): Promise<{ summary: string; actionItems: string[]; keyPoints: string[] }> {
  const namedTranscript = segments
    .map((s) => `${s.speaker ?? "Unknown"}: ${s.text}`)
    .join("\n")

  const prompt = language === "ar"
    ? `أنت مساعد اجتماعات خبير. التالي نص الاجتماع${meetingTitle ? ` "${meetingTitle}"` : ""}:\n\n${namedTranscript}\n\nأنشئ ملخصاً شاملاً باللغة العربية (اللهجة السعودية). أرجع JSON بالشكل التالي:\n{\n  "summary": "ملخص مفصل للاجتماع ٢-٣ فقرات",\n  "keyPoints": ["نقطة ١", "نقطة ٢", ...],\n  "actionItems": ["مهمة ١ - المسؤول إن ذُكر", ...]\n}\nJSON فقط.`
    : `You are an expert meeting assistant. Here is the meeting transcript${meetingTitle ? ` for "${meetingTitle}"` : ""}:\n\n${namedTranscript}\n\nGenerate a comprehensive meeting summary. Return ONLY valid JSON:\n{\n  "summary": "2-3 paragraph detailed summary",\n  "keyPoints": ["Key point 1", "Key point 2", ...],\n  "actionItems": ["Action item with owner if mentioned", ...]\n}\nJSON only.`

  const { text } = await generateText({ model: getAiModel(), prompt })

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON")
    return JSON.parse(match[0])
  } catch {
    return { summary: text, keyPoints: [], actionItems: [] }
  }
}

export async function processMeetingRecording(
  audioBuffer: Buffer,
  filename: string,
  options: { language?: string; meetingTitle?: string; outputLanguage?: "ar" | "en" } = {}
): Promise<MeetingSummary> {
  const outputLang = options.outputLanguage ?? "ar"
  const rawSegments = await transcribeAudio(audioBuffer, filename, options.language)
  const duration = rawSegments.length ? rawSegments[rawSegments.length - 1].end : 0
  const hasArabic = rawSegments.some((s) => /[\u0600-\u06FF]/.test(s.text))
  const transcriptLang: "ar" | "en" = hasArabic ? "ar" : "en"
  const { segments, speakers } = await identifySpeakers(rawSegments, transcriptLang)
  const { summary, actionItems, keyPoints } = await generateMeetingSummary(segments, speakers, outputLang, options.meetingTitle)

  return { transcript: segments, speakers, summary, actionItems, keyPoints, duration, language: transcriptLang }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
