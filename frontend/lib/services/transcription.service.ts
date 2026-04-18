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

// ── Gemini REST helpers ────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!key) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set")
  return key
}

interface GeminiFileResponse {
  file: { uri: string; name: string; state: string; mimeType: string }
}

/**
 * Upload audio buffer to Gemini File API and return the file URI.
 * All files go through the File API to avoid SDK version incompatibilities
 * with inline base64 handling.
 */
async function uploadToGeminiFileApi(
  buffer: Buffer,
  mimeType: string,
  displayName: string
): Promise<string> {
  const apiKey = getApiKey()

  const boundary = `gemini_boundary_${Date.now()}`
  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${JSON.stringify({ file: { displayName, mimeType } })}\r\n`
  const dataPart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  const closing  = `\r\n--${boundary}--`

  const body = Buffer.concat([
    Buffer.from(metaPart),
    Buffer.from(dataPart),
    buffer,
    Buffer.from(closing),
  ])

  const uploadRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "X-Goog-Upload-Protocol": "multipart",
      },
      body,
    }
  )

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => "")
    throw new Error(`Gemini File API upload failed (${uploadRes.status}): ${errText}`)
  }

  const { file } = await uploadRes.json() as GeminiFileResponse

  // Wait for file to become ACTIVE
  if (file.state !== "ACTIVE") {
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const checkRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${file.name}?key=${apiKey}`
      )
      if (!checkRes.ok) break
      const checkData = await checkRes.json() as { state: string }
      if (checkData.state === "ACTIVE") break
      if (checkData.state === "FAILED") throw new Error("Gemini file processing FAILED")
    }
  }

  console.log(`[transcription] File API upload complete: ${file.name} (${Math.round(buffer.length / 1024)}KB)`)
  return file.uri
}

/** Delete a file from Gemini File API after processing (cleanup). */
async function deleteGeminiFile(uri: string): Promise<void> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) return
  const match = uri.match(/files\/[^/?]+/)
  if (!match) return
  await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${match[0]}?key=${apiKey}`,
    { method: "DELETE" }
  ).catch(() => {})
}

/**
 * Call Gemini generateContent REST endpoint directly.
 * Bypasses @ai-sdk/google to avoid version incompatibilities with the
 * convertToBase64 helper that is missing in @ai-sdk/provider-utils v2.
 * Retries up to 4 times on 503/429 with exponential backoff.
 */
async function callGeminiWithFileUri(
  prompt: string,
  fileUri: string,
  mimeType: string,
  maxOutputTokens = 8000
): Promise<string> {
  const apiKey = getApiKey()

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { fileData: { mimeType, fileUri } },
      ]
    }],
    generationConfig: { maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } },
  }

  const RETRYABLE = new Set([429, 503])
  let lastError: Error = new Error("Gemini request failed")

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(4000 * 2 ** (attempt - 1), 30000) // 4s, 8s, 16s
      console.log(`[transcription] Gemini retry ${attempt} after ${delay}ms`)
      await new Promise(r => setTimeout(r, delay))
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      lastError = new Error(`Gemini generateContent failed (${res.status}): ${errText}`)
      if (RETRYABLE.has(res.status)) continue
      throw lastError
    }

    interface GeminiContentResponse {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
      }>
      error?: { message: string }
    }

    const data = await res.json() as GeminiContentResponse
    if (data.error) throw new Error(`Gemini API error: ${data.error.message}`)

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error("Gemini returned empty response")
    return text
  }

  throw lastError
}

// ── Main processing function ───────────────────────────────────────────────────

/**
 * Single-pass processing: send audio once to Gemini and get back
 * transcript + speaker IDs + summary + key points + action items.
 *
 * Always uses the Gemini File API (avoids SDK convertToBase64 version issue).
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

  // Always upload to Gemini File API — avoids @ai-sdk/google convertToBase64 bug
  console.log(`[transcription] Uploading ${Math.round(audioBuffer.length / 1024)}KB to Gemini File API`)
  const geminiFileUri = await uploadToGeminiFileApi(audioBuffer, mimeType, filename)

  let text: string
  try {
    text = await callGeminiWithFileUri(prompt, geminiFileUri, mimeType, 8000)
  } finally {
    // Always clean up the uploaded file
    deleteGeminiFile(geminiFileUri).catch(() => {})
  }

  // ── Parse JSON response ────────────────────────────────────────────────────
  let parsed: {
    transcript?: TranscriptSegment[]
    speakers?: Record<string, string>
    summary?: string
    keyPoints?: string[]
    actionItems?: string[]
  } = {}

  try {
    // Brace-counting parser — correctly handles Gemini wrapping JSON in markdown
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

// ── Backward-compat exports ────────────────────────────────────────────────────

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
  const namedTranscript = segments.map(s => `${s.speaker ?? "Unknown"}: ${s.text}`).join("\n")
  const prompt = language === "ar"
    ? `ملخص الاجتماع${meetingTitle ? ` "${meetingTitle}"` : ""}:\n\n${namedTranscript}\n\nأرجع JSON:\n{"summary":"...","keyPoints":["..."],"actionItems":["..."]}`
    : `Meeting${meetingTitle ? ` "${meetingTitle}"` : ""}:\n\n${namedTranscript}\n\nReturn JSON:\n{"summary":"...","keyPoints":["..."],"actionItems":["..."]}`

  const apiKey = getApiKey()
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 4000, thinkingConfig: { thinkingBudget: 0 } },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )

  interface GeminiRes { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const data = await res.json() as GeminiRes
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

  try {
    const start = text.indexOf("{")
    if (start !== -1) {
      let depth = 0, end = -1
      for (let i = start; i < text.length; i++) {
        if (text[i] === "{") depth++
        else if (text[i] === "}") { depth--; if (depth === 0) { end = i; break } }
      }
      if (end !== -1) return JSON.parse(text.slice(start, end + 1))
    }
    throw new Error("No JSON")
  } catch {
    return { summary: text, keyPoints: [], actionItems: [] }
  }
}
