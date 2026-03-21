import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params

  const { error } = await auth.supabase
    .from("focus_sessions")
    .update({ status: "abandoned", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.userId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
