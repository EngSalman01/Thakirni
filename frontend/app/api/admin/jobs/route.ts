import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data: profile } = await supabase
      .from("profiles").select("is_admin").eq("id", user.id).single()
    return profile?.is_admin === true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? "pending"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 50
  const offset = (page - 1) * limit

  const service = getServiceSupabase()
  const query = service
    .from("jobs")
    .select("id, type, status, payload, attempts, max_retries, error, run_at, started_at, finished_at, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== "all") query.eq("status", status)

  const { data, count, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ jobs: data ?? [], total: count ?? 0, page, limit })
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return new Response("Unauthorized", { status: 401 })

  const { id } = await req.json()
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const service = getServiceSupabase()
  const { error } = await service.from("jobs").delete().eq("id", id)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return new Response("Unauthorized", { status: 401 })

  const { id } = await req.json()
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  // Retry: reset to pending with attempts cleared
  const service = getServiceSupabase()
  const { error } = await service
    .from("jobs")
    .update({ status: "pending", attempts: 0, error: null, run_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
