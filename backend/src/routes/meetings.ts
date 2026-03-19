import { createRouter } from "../lib/types.js"
import { Hono } from "hono"
import { requireAuth, checkPlanLimits } from "../middleware/auth.js"
import { processMeetingRecording } from "../services/transcription.service.js"
import { getUserSupabase, getServiceSupabase } from "../lib/supabase.js"

export const meetingsRouter = createRouter()

// All routes require auth
meetingsRouter.use("*", requireAuth)

/**
 * POST /api/meetings/upload
 * Upload a meeting recording for transcription and summarization.
 * Multipart form data: audio file + optional metadata.
 */
meetingsRouter.post("/upload", checkPlanLimits("meeting_summary"), async (c) => {
  try {
    const userId = c.get("userId") as string
    const accessToken = c.get("accessToken") as string

    const formData = await c.req.formData()
    const file = formData.get("audio") as File | null
    const title = (formData.get("title") as string) ?? "Meeting"
    const outputLanguage = ((formData.get("language") as string) ?? "ar") as "ar" | "en"

    if (!file) {
      return c.json({ error: "No audio file provided" }, 400)
    }

    // Validate file type
    const allowed = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a", "audio/mp4", "audio/webm", "video/mp4", "video/webm"]
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|mp4|webm|flac)$/i)) {
      return c.json({ error: "Unsupported audio format. Use MP3, WAV, M4A, MP4, or WebM." }, 400)
    }

    // Max 100MB
    if (file.size > 100 * 1024 * 1024) {
      return c.json({ error: "File too large. Maximum 100MB." }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Process the recording
    const result = await processMeetingRecording(buffer, file.name, {
      meetingTitle: title,
      outputLanguage,
    })

    // Save to database
    const supabase = getUserSupabase(accessToken)
    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        user_id: userId,
        title,
        duration_seconds: Math.round(result.duration),
        language: result.language,
        speaker_count: Object.keys(result.speakers).length,
        speakers: result.speakers,
        transcript: result.transcript,
        summary: result.summary,
        key_points: result.keyPoints,
        action_items: result.actionItems,
        file_size_bytes: file.size,
        status: "completed",
      })
      .select()
      .single()

    if (error) {
      console.error("[Meetings] DB save error:", error)
      return c.json({ error: "Failed to save meeting" }, 500)
    }

    // Log to timeline
    const service = getServiceSupabase()
    service.from("timeline_events").insert({
      user_id: userId,
      title: `Meeting recorded: ${title}`,
      event_date: new Date().toISOString().split("T")[0],
      source_type: "meeting_recorded",
      source_id: meeting.id,
      importance: 2,
    }).then(undefined, () => {})

    return c.json({
      success: true,
      meeting,
      summary: result.summary,
      speakers: result.speakers,
      keyPoints: result.keyPoints,
      actionItems: result.actionItems,
      transcript: result.transcript,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Processing failed"
    console.error("[Meetings] Error:", msg)
    return c.json({ error: msg }, 500)
  }
})

/**
 * GET /api/meetings
 * List all meetings for the current user.
 */
meetingsRouter.get("/", async (c) => {
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const limit = parseInt(c.req.query("limit") ?? "20")
  const offset = parseInt(c.req.query("offset") ?? "0")

  const { data, error } = await supabase
    .from("meetings")
    .select("id, title, duration_seconds, speaker_count, language, summary, key_points, action_items, status, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ meetings: data ?? [], count: data?.length ?? 0 })
})

/**
 * GET /api/meetings/:id
 * Get a full meeting with transcript.
 */
meetingsRouter.get("/:id", async (c) => {
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) return c.json({ error: "Meeting not found" }, 404)
  return c.json({ meeting: data })
})

/**
 * DELETE /api/meetings/:id
 */
meetingsRouter.delete("/:id", async (c) => {
  const accessToken = c.get("accessToken") as string
  const userId = c.get("userId") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})
