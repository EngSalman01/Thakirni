import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params

  const { error } = await auth.supabase.from("goals").delete().eq("id", id).eq("user_id", auth.userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
