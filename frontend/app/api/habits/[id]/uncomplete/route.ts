import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params
  const today = new Date().toISOString().split("T")[0]

  await auth.supabase.from("habit_logs").delete().eq("habit_id", id).eq("user_id", auth.userId).eq("log_date", today)
  return Response.json({ success: true })
}
