import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { createClient as createServiceSupabase } from "@supabase/supabase-js"

function getServiceClient() {
  return createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params

  const { data, error } = await auth.supabase.from("meetings").select("*").eq("id", id).eq("user_id", auth.userId).single()
  if (error || !data) return Response.json({ error: "Meeting not found" }, { status: 404 })
  return Response.json({ meeting: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params
  const service = getServiceClient()

  // Fetch storage path before deleting the record
  const { data: meeting } = await service
    .from("meetings")
    .select("audio_storage_path, user_id")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .single()

  // Delete DB record
  const { error } = await auth.supabase.from("meetings").delete().eq("id", id).eq("user_id", auth.userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Clean up audio file from storage (fire-and-forget)
  if (meeting?.audio_storage_path) {
    service.storage
      .from("meetings-audio")
      .remove([meeting.audio_storage_path as string])
      .catch((err) => console.error("[meetings/delete] storage cleanup failed:", err))
  }

  return Response.json({ success: true })
}
