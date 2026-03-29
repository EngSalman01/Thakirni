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
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const endpoint = searchParams.get("endpoint") ?? ""
  const hasError = searchParams.get("errors") === "true"
  const limit = 50
  const offset = (page - 1) * limit

  const service = getServiceSupabase()
  let query = service
    .from("request_logs")
    .select("id, endpoint, method, status_code, duration_ms, tokens_used, model, error, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (endpoint) query = query.ilike("endpoint", `%${endpoint}%`)
  if (hasError) query = query.not("error", "is", null)

  const { data: logs, count, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Aggregated stats for dashboard cards
  const { data: statsData } = await service
    .from("request_logs")
    .select("endpoint, status_code, duration_ms, tokens_used, error")
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const stats = computeStats(statsData ?? [])

  return Response.json({ logs: logs ?? [], total: count ?? 0, page, limit, stats })
}

function computeStats(rows: Array<{
  endpoint: string
  status_code: number | null
  duration_ms: number | null
  tokens_used: number | null
  error: string | null
}>) {
  const total = rows.length
  const errors = rows.filter(r => r.error || (r.status_code && r.status_code >= 500)).length
  const errorRate = total ? Math.round((errors / total) * 100) : 0
  const avgDuration = total
    ? Math.round(rows.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / total)
    : 0
  const totalTokens = rows.reduce((s, r) => s + (r.tokens_used ?? 0), 0)

  // Top endpoints by volume
  const endpointCounts: Record<string, number> = {}
  for (const r of rows) {
    endpointCounts[r.endpoint] = (endpointCounts[r.endpoint] ?? 0) + 1
  }
  const topEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([endpoint, count]) => ({ endpoint, count }))

  // Slowest endpoints (avg duration)
  const endpointDuration: Record<string, number[]> = {}
  for (const r of rows) {
    if (r.duration_ms) {
      if (!endpointDuration[r.endpoint]) endpointDuration[r.endpoint] = []
      endpointDuration[r.endpoint].push(r.duration_ms)
    }
  }
  const slowestEndpoints = Object.entries(endpointDuration)
    .map(([endpoint, durations]) => ({
      endpoint,
      avgMs: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
    }))
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 5)

  return { total, errors, errorRate, avgDuration, totalTokens, topEndpoints, slowestEndpoints }
}
