import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

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

  const { error } = await auth.supabase.from("meetings").delete().eq("id", id).eq("user_id", auth.userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
