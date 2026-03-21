import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params
  const { progress } = await req.json() as { progress: number }
  const status = progress >= 100 ? "completed" : "active"

  const { data, error } = await auth.supabase
    .from("goals")
    .update({ progress: Math.min(100, Math.max(0, progress)), status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true, goal: data })
}
