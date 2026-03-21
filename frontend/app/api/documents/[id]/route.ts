import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params

  const { data, error } = await auth.supabase.from("documents").select("*").eq("id", id).single()
  if (error || !data) return Response.json({ error: "Document not found" }, { status: 404 })
  return Response.json({ document: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { id } = await params

  const { error } = await auth.supabase.from("documents").delete().eq("id", id).eq("user_id", auth.userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
