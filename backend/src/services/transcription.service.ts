import { getGroqSDK, getAiModel } from "./ai.service.js"
import { generateText } from "ai"
import fs from "fs"
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
  speakers: Record<string, string>  // "Speaker 1" → "Ahmed" (if detected)
  summary: string
  actionItems: string[]
  keyPoints: string[]
  duration: number
  language: "ar" | "en"
}

/**
 * Transcribe audio using Groq Whisper with segment-level timestamps.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
  language?: string
): Promise<TranscriptSegment[]> {
  const groq = getGroqSDK()

  // Write buffer to a temp file (Groq SDK requires a file-like object)
  const tmpPath = path.join("/tmp", `thakirni_${Date.now()}_${filename}`)
  fs.writeFileSync(tmpPath, audioBuffer)

  try {
    const file = fs.createReadStream(tmpPath)

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
      ...(language ? { language } : {}),
    }) as unknown as {
      text: string
      segments?: Array<{ start: number; end: number; text: string }>
    }

    const rawSegs = transcription.segments ?? []
    const segments: TranscriptSegment[] = rawSegs.map((seg, i) => ({
      id: i,
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    }))

    return segments
  } finally {
    try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
  }
}

/**
 * Use the LLM to identify speakers across transcript segments.
 * Returns updated segments with speaker labels + a speaker name map.
 */
export async function identifySpeakers(
  segments: TranscriptSegment[],
  language: "ar" | "en" = "en"
): Promise<{ segments: TranscriptSegment[]; speakers: Record<string, string> }> {
  if (!segments.length) return { segments, speakers: {} }

  // Format transcript for LLM analysis
  const transcriptText = segments
    .map((s) => `[${formatTime(s.start)}-${formatTime(s.end)}] ${s.text}`)
    .join("\n")

  const prompt = language === "ar"
    ? `أنت خبير في تحليل المحادثات الصوتية. التالي نص من اجتماع:\n\n${transcriptText}\n\n
المطلوب:
1. حدد المتحدثين (Speaker 1, Speaker 2, ...) بناءً على تغيير المتحدث في السياق والأسلوب
2. إذا ذُكر اسم شخص في النص، استخدم الاسم بدلاً من Speaker X
3. أرجع JSON فقط بالشكل التالي:
{
  "speakers": {"Speaker 1": "اسم إن وُجد", "Speaker 2": "..."},
  "segments": [{"id": 0, "speaker": "Speaker 1"}, ...]
}
فقط JSON، بدون شرح.`
    : `You are an expert at analyzing conversation transcripts. Here is a meeting transcript:

${transcriptText}

Task:
1. Identify speakers (Speaker 1, Speaker 2, ...) based on context, speaking style, and conversation flow
2. If a name is mentioned in the text (e.g., "I'm Ahmed", "Thanks Sarah"), use that name instead of Speaker X
3. Return ONLY valid JSON in this exact format:
{
  "speakers": {"Speaker 1": "name if detected or keep as Speaker 1", "Speaker 2": "..."},
  "segments": [{"id": 0, "speaker": "Speaker 1"}, ...]
}
JSON only, no explanation.`

  try {
    const { text } = await generateText({ model: getAiModel(), prompt })
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON in response")

    const parsed = JSON.parse(match[0]) as {
      speakers: Record<string, string>
      segments: Array<{ id: number; speaker: string }>
    }

    // Merge speaker info back into segments
    const speakerMap = new Map(parsed.segments.map((s) => [s.id, s.speaker]))
    const updatedSegments = segments.map((seg) => ({
      ...seg,
      speaker: speakerMap.get(seg.id) ?? "Unknown",
    }))

    // Build final speaker names: prefer detected name, fallback to Speaker X
    const speakers: Record<string, string> = {}
    for (const [key, name] of Object.entries(parsed.speakers)) {
      speakers[key] = name && name !== key ? name : key
    }

    return { segments: updatedSegments, speakers }
  } catch {
    // Fallback: alternate speakers naively
    const updatedSegments = segments.map((seg, i) => ({
      ...seg,
      speaker: `Speaker ${(i % 2) + 1}`,
    }))
    return { segments: updatedSegments, speakers: {} }
  }
}

/**
 * Generate a comprehensive meeting summary from identified segments.
 */
export async function generateMeetingSummary(
  segments: TranscriptSegment[],
  speakers: Record<string, string>,
  language: "ar" | "en" = "en",
  meetingTitle?: string
): Promise<{ summary: string; actionItems: string[]; keyPoints: string[] }> {
  // Build readable transcript with speaker names
  const namedTranscript = segments
    .map((s) => `${s.speaker ?? "Unknown"}: ${s.text}`)
    .join("\n")

  const prompt = language === "ar"
    ? `أنت مساعد اجتماعات خبير. التالي نص الاجتماع${meetingTitle ? ` "${meetingTitle}"` : ""}:\n\n${namedTranscript}\n\n
أنشئ ملخصاً شاملاً باللغة العربية (اللهجة السعودية). أرجع JSON بالشكل التالي:
{
  "summary": "ملخص مفصل للاجتماع ٢-٣ فقرات",
  "keyPoints": ["نقطة ١", "نقطة ٢", ...],
  "actionItems": ["مهمة ١ - المسؤول إن ذُكر", ...]
}
JSON فقط.`
    : `You are an expert meeting assistant. Here is the meeting transcript${meetingTitle ? ` for "${meetingTitle}"` : ""}:\n\n${namedTranscript}\n\n
Generate a comprehensive meeting summary. Return ONLY valid JSON:
{
  "summary": "2-3 paragraph detailed summary of what was discussed",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "actionItems": ["Action item with owner if mentioned", ...]
}
JSON only, no extra text.`

  const { text } = await generateText({ model: getAiModel(), prompt })

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON")
    return JSON.parse(match[0])
  } catch {
    return {
      summary: text,
      keyPoints: [],
      actionItems: [],
    }
  }
}

/**
 * Full pipeline: transcribe → identify speakers → summarize
 */
export async function processMeetingRecording(
  audioBuffer: Buffer,
  filename: string,
  options: {
    language?: string
    meetingTitle?: string
    outputLanguage?: "ar" | "en"
  } = {}
): Promise<MeetingSummary> {
  const outputLang = options.outputLanguage ?? "ar"

  // Step 1: Transcribe
  const rawSegments = await transcribeAudio(audioBuffer, filename, options.language)

  // Step 2: Identify duration
  const duration = rawSegments.length
    ? rawSegments[rawSegments.length - 1].end
    : 0

  // Step 3: Detect transcript language
  const hasArabic = rawSegments.some((s) => /[\u0600-\u06FF]/.test(s.text))
  const transcriptLang: "ar" | "en" = hasArabic ? "ar" : "en"

  // Step 4: Identify speakers
  const { segments, speakers } = await identifySpeakers(rawSegments, transcriptLang)

  // Step 5: Generate summary
  const { summary, actionItems, keyPoints } = await generateMeetingSummary(
    segments,
    speakers,
    outputLang,
    options.meetingTitle
  )

  return {
    transcript: segments,
    speakers,
    summary,
    actionItems,
    keyPoints,
    duration,
    language: transcriptLang,
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
