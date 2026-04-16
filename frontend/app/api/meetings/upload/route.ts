import { NextRequest } from "next/server"
import { requireAuth, checkPlanFeature } from "@/lib/api-auth"
import { createClient as createServiceSupabase } from "@supabase/supabase-js"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"
import { trackEvent } from "@/lib/analytics"
import { enforceUsage } from "@/lib/usage/enforce"
import path from "path"

export const maxDuration = 30 // just for the upload + queue step

function getServiceClient() {
  return createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Rate limit: 10 uploads per hour (workspace-scoped)
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
    const formData = await req.formData()
    const file = formData.get("audio") as File | null
    const title = (formData.get("title") as string) ?? "Meeting"
    const outputLanguage = ((formData.get("language") as string) ?? "ar") as "ar" | "en"

    if (!file) return Response.json({ error: "No audio file provided" }, { status: 400 })

    const allowed_types = ["audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a", "audio/mp4", "audio/webm", "video/mp4", "video/webm"]
    if (!allowed_types.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|mp4|webm|flac)$/i)) {
      return Response.json({ error: "Unsupported audio format. Use MP3, WAV, M4A, MP4, or WebM." }, { status: 400 })
    }

    if (file.size > 200 * 1024 * 1024) {
      return Response.json({ error: "File too large. Maximum 200MB." }, { status: 400 })
    }

    const service = getServiceClient()

    // ── 1. Create a "processing" meeting record first to get an ID ────────────
    const { data: meeting, error: insertError } = await service
      .from("meetings")
      .insert({
        user_id: auth.userId,
        title,
        status: "processing",
        language: outputLanguage,
      })
      .select()
      .single()

    if (insertError || !meeting) {
      console.error("[meetings/upload] insert error:", insertError)
      return Response.json({ error: "Failed to create meeting record" }, { status: 500 })
    }

    // ── 2. Upload audio to Supabase Storage ───────────────────────────────────
    const ext = path.extname(file.name).toLowerCase() || ".mp3"
    const storagePath = `${auth.userId}/${meeting.id}${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await service.storage
      .from("meetings-audio")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || "audio/mpeg",
        upsert: true,
      })

    if (uploadError) {
      // Cleanup the meeting record on storage failure
      await service.from("meetings").delete().eq("id", meeting.id)
      console.error("[meetings/upload] storage error:", uploadError)
      return Response.json({ error: "Failed to upload audio file" }, { status: 500 })
    }

    // ── 3. Update meeting with storage path + metadata ────────────────────────
    await service.from("meetings").update({
      audio_storage_path: storagePath,
    }).eq("id", meeting.id)

    // ── 4. Fire-and-forget: trigger background processing ─────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    fetch(`${appUrl}/api/meetings/${meeting.id}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.CRON_SECRET ?? "",
      },
      body: JSON.stringify({ outputLanguage, meetingTitle: title }),
    }).catch((err) => {
      console.error("[meetings/upload] background trigger failed (cron will retry):", err)
    })

    // ── 5. Track & return immediately ─────────────────────────────────────────
    trackEvent("meeting_uploaded")

    return Response.json({
      success: true,
      processing: true,
      meeting: { ...meeting, audio_storage_path: storagePath },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed"
    console.error("[meetings/upload] error:", msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
