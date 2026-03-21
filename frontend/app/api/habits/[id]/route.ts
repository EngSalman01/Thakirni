import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params

  await auth.supabase.from("habits").update({ is_active: false }).eq("id", id).eq("user_id", auth.userId)
  return Response.json({ success: true })
}
