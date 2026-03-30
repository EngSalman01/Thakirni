import { NextRequest } from "next/server"
import { requireAuth, checkPlanFeature } from "@/lib/api-auth"
import { processMeetingRecording } from "@/lib/services/transcription.service"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"
import { trackEvent } from "@/lib/analytics"
import { enforceUsage } from "@/lib/usage/enforce"
import { incrementUsage } from "@/lib/usage/increment"

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Rate limit: 10 uploads per hour per user
  const rl = await limiters.upload(auth.userId)
  if (!rl.success) return rateLimitResponse(rl.reset)

  // Feature gate — resolved from workspace owner's plan
  const { allowed: featureAllowed } = await checkPlanFeature(auth.workspace?.ownerId ?? auth.userId, "meeting_summary")
  if (!featureAllowed) {
    return Response.json({ error: "upgrade_required", message: "هذه الميزة تحتاج اشتراك Pro أو أعلى", feature: "meeting_summary" }, { status: 403 })
  }

  // Usage enforcement (workspace-scoped)
  const enforcement = await enforceUsage(
    auth.userId, "meeting_summary",
    auth.workspace?.workspaceId,
    auth.workspace?.ownerId
  )
  if (!enforcement.allowed) {
    if (enforcement.reason === "kill_switch") return Response.json({ error: "AI features temporarily unavailable" }, { status: 503 })
    if (enforcement.reason === "upgrade_required") return Response.json({ error: "upgrade_required", feature: "meeting_summary" }, { status: 403 })
    return Response.json({ error: "Monthly meeting summary limit reached. Upgrade for more.", code: "limit_exceeded", remaining: 0 }, { status: 429 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("audio") as File | null
    const title = (formData.get("title") as string) ?? "Meeting"
    const outputLanguage = ((formData.get("language") as string) ?? "ar") as "ar" | "en"

    if (!file) return Response.json({ error: "No audio file provided" }, { status: 400 })

    const allowed_types = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a", "audio/mp4", "audio/webm", "video/mp4", "video/webm"]
    if (!allowed_types.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|mp4|webm|flac)$/i)) {
      return Response.json({ error: "Unsupported audio format. Use MP3, WAV, M4A, MP4, or WebM." }, { status: 400 })
    }

    if (file.size > 100 * 1024 * 1024) {
      return Response.json({ error: "File too large. Maximum 100MB." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await processMeetingRecording(buffer, file.name, { meetingTitle: title, outputLanguage })

    const { data: meeting, error } = await auth.supabase
      .from("meetings")
      .insert({
        user_id: auth.userId,
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

    if (error) return Response.json({ error: "Failed to save meeting" }, { status: 500 })

    // Increment after success (workspace-scoped)
    incrementUsage(auth.userId, "meeting_summary", 1, auth.workspace?.workspaceId).catch(() => {})
    trackEvent("meeting_uploaded")

    auth.service.from("timeline_events").insert({
      user_id: auth.userId,
      title: `Meeting recorded: ${title}`,
      event_date: new Date().toISOString().split("T")[0],
      source_type: "meeting_recorded",
      source_id: meeting.id,
      importance: 2,
    }).then(undefined, (err) => { console.error("[Meetings] timeline_events insert failed:", err) })

    return Response.json({ success: true, meeting, summary: result.summary, speakers: result.speakers, keyPoints: result.keyPoints, actionItems: result.actionItems, transcript: result.transcript })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Processing failed"
    return Response.json({ error: msg }, { status: 500 })
  }
}
