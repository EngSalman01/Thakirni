import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params
  const body = await req.json() as { actual_minutes?: number; notes?: string }

  const { data, error } = await auth.supabase
    .from("focus_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString(), actual_minutes: body.actual_minutes ?? null, notes: body.notes ?? null })
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  auth.service.from("timeline_events").insert({
    user_id: auth.userId,
    title: `Focus session: ${data.duration_minutes} min`,
    event_date: new Date().toISOString().split("T")[0],
    source_type: "focus_completed",
    source_id: id,
    importance: 1,
  }).then(undefined, (e) => console.error("[focus/complete] timeline insert error:", e))

  return Response.json({ success: true, session: data })
}
