import { NextRequest } from "next/server"
import { requireAuth, checkPlanFeature } from "@/lib/api-auth"
import { createClient as createServiceSupabase } from "@supabase/supabase-js"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"
import { trackEvent } from "@/lib/analytics"
import { enforceUsage } from "@/lib/usage/enforce"

export const maxDuration = 30

function getServiceClient() {
  return createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/meetings/upload
 *
 * Accepts JSON metadata only — no file. The client uploads the audio file
 * directly to Supabase Storage (bypassing the 4.5 MB Vercel body limit),
 * then calls this route to create the DB record and get back the storage path.
 *
 * Body: { title, language, fileExt, fileSize }
 * Returns: { meetingId, storagePath }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const rl = await limiters.upload(auth.userId, auth.workspace?.workspaceId)
  if (!rl.success) return rateLimitResponse(rl.reset)

  // Feature gate
  const { allowed: featureAllowed } = await checkPlanFeature(auth.workspace?.ownerId ?? auth.userId, "meeting_summary")
  if (!featureAllowed) {
    return Response.json({ error: "upgrade_required", message: "هذه الميزة تحتاج اشتراك Pro أو أعلى", feature: "meeting_summary" }, { status: 403 })
  }

  // Usage enforcement
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
    const body = await req.json() as { title?: string; language?: string; fileExt?: string; fileSize?: number }
    const title = body.title ?? "Meeting"
    const outputLanguage = (body.language ?? "ar") as "ar" | "en"
    const fileExt = (body.fileExt ?? ".mp3").replace(/^\.?/, ".").toLowerCase()
    const fileSize = body.fileSize ?? null

    const allowedExts = [".mp3", ".wav", ".ogg", ".m4a", ".mp4", ".webm", ".flac"]
    if (!allowedExts.includes(fileExt)) {
      return Response.json({ error: "Unsupported audio format. Use MP3, WAV, M4A, MP4, or WebM." }, { status: 400 })
    }

    if (fileSize && fileSize > 500 * 1024 * 1024) {
      return Response.json({ error: "File too large. Maximum 500MB." }, { status: 400 })
    }

    const service = getServiceClient()

    // Create the meeting record in "processing" state
    const { data: meeting, error: insertError } = await service
      .from("meetings")
      .insert({
        user_id: auth.userId,
        title,
        status: "processing",
        language: outputLanguage,
        file_size_bytes: fileSize,
      })
      .select("id")
      .single()

    if (insertError || !meeting) {
      console.error("[meetings/upload] insert error:", insertError)
      return Response.json({ error: "Failed to create meeting record" }, { status: 500 })
    }

    const storagePath = `${auth.userId}/${meeting.id}${fileExt}`

    // Store the path so the process route can find the audio
    await service.from("meetings").update({ audio_storage_path: storagePath }).eq("id", meeting.id)

    trackEvent("meeting_uploaded")

    return Response.json({
      success: true,
      meetingId: meeting.id,
      storagePath,
      bucket: "meetings-audio",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed"
    console.error("[meetings/upload] error:", msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
