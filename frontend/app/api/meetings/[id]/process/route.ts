import { NextRequest } from "next/server"
import { createClient as createServiceSupabase } from "@supabase/supabase-js"
import { processMeetingRecording } from "@/lib/services/transcription.service"
import { incrementUsage } from "@/lib/usage/increment"

export const maxDuration = 300 // 5 min — Vercel Fluid Compute max

function getServiceClient() {
  return createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth: internal secret only (called by upload route, not by users) ─────
  const secret = req.headers.get("x-internal-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { outputLanguage, meetingTitle } = await req.json().catch(() => ({})) as {
    outputLanguage?: "ar" | "en"
    meetingTitle?: string
  }

  const service = getServiceClient()

  // ── 1. Fetch the meeting record ────────────────────────────────────────────
  const { data: meeting, error: fetchError } = await service
    .from("meetings")
    .select("id, user_id, title, language, status, audio_storage_path, file_size_bytes")
    .eq("id", id)
    .single()

  if (fetchError || !meeting) {
    console.error("[meetings/process] meeting not found:", id, fetchError)
    return Response.json({ error: "Meeting not found" }, { status: 404 })
  }

  // Idempotency: skip if already processed
  if (meeting.status === "completed") {
    return Response.json({ success: true, skipped: true })
  }

  if (!meeting.audio_storage_path) {
    await service.from("meetings").update({ status: "failed" }).eq("id", id)
    return Response.json({ error: "No audio file stored for this meeting" }, { status: 422 })
  }

  // ── 2. Download audio from Supabase Storage ────────────────────────────────
  const { data: audioData, error: downloadError } = await service.storage
    .from("meetings-audio")
    .download(meeting.audio_storage_path as string)

  if (downloadError || !audioData) {
    console.error("[meetings/process] storage download failed:", downloadError)
    await service.from("meetings").update({ status: "failed" }).eq("id", id)
    return Response.json({ error: "Failed to download audio from storage" }, { status: 500 })
  }

  // ── 3. Process with Gemini (transcribe + diarize + summarize in one pass) ──
  const arrayBuffer = await audioData.arrayBuffer()
  const audioBuffer = Buffer.from(arrayBuffer)
  const ext = (meeting.audio_storage_path as string).split(".").pop() ?? "mp3"
  const filename = `recording.${ext}`

  let result
  try {
    result = await processMeetingRecording(audioBuffer, filename, {
      meetingTitle: meetingTitle ?? (meeting.title as string),
      outputLanguage: outputLanguage ?? ((meeting.language as "ar" | "en") ?? "ar"),
    })
  } catch (processingErr) {
    console.error("[meetings/process] Gemini processing failed:", processingErr)
    await service.from("meetings").update({ status: "failed" }).eq("id", id)
    return Response.json({ error: "AI processing failed" }, { status: 500 })
  }

  // ── 4. Persist results ─────────────────────────────────────────────────────
  const { error: updateError } = await service.from("meetings").update({
    status: "completed",
    duration_seconds: Math.round(result.duration),
    language: result.language,
    speaker_count: Object.keys(result.speakers).length,
    speakers: result.speakers,
    transcript: result.transcript,
    summary: result.summary,
    key_points: result.keyPoints,
    action_items: result.actionItems,
    updated_at: new Date().toISOString(),
  }).eq("id", id)

  if (updateError) {
    console.error("[meetings/process] DB update failed:", updateError)
    return Response.json({ error: "Failed to save results" }, { status: 500 })
  }

  // ── 5. Post-success side-effects ──────────────────────────────────────────
  incrementUsage(meeting.user_id as string, "meeting_summary").catch(() => {})

  service.from("timeline_events").insert({
    user_id: meeting.user_id,
    title: `Meeting recorded: ${meeting.title}`,
    event_date: new Date().toISOString().split("T")[0],
    source_type: "meeting_recorded",
    source_id: id,
    importance: 2,
  }).then(undefined, (err) => { console.error("[meetings/process] timeline_events failed:", err) })

  console.log(`[meetings/process] ✓ completed meeting ${id} — ${result.transcript.length} segments, ${Math.round(result.duration)}s`)

  return Response.json({
    success: true,
    meetingId: id,
    duration: result.duration,
    speakerCount: Object.keys(result.speakers).length,
    segmentCount: result.transcript.length,
  })
}
