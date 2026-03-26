import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; mid: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id, mid } = await params

  await auth.supabase
    .from("goal_milestones")
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq("id", mid)
    .eq("goal_id", id)

  const { data: milestones } = await auth.supabase
    .from("goal_milestones")
    .select("is_completed")
    .eq("goal_id", id)

  if (milestones) {
    const total = milestones.length
    const done = milestones.filter((m) => m.is_completed).length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    const status = progress >= 100 ? "done" : "active"
    await auth.supabase.from("goals").update({ progress, status }).eq("id", id).eq("user_id", auth.userId)
  }

  return Response.json({ success: true })
}
