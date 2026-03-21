import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getUserSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export interface AuthResult {
  userId: string
  accessToken: string
  supabase: ReturnType<typeof getUserSupabase>
  service: ReturnType<typeof getServiceSupabase>
}

export async function requireAuth(req: NextRequest): Promise<AuthResult | Response> {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized — missing token" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const supabase = getUserSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: "Unauthorized — invalid token" }, { status: 401 })
  }

  return {
    userId: user.id,
    accessToken: token,
    supabase,
    service: getServiceSupabase(),
  }
}

export async function checkPlanFeature(
  userId: string,
  feature: "meeting_summary" | "document_ai" | "voice_note"
): Promise<{ allowed: boolean; tier: string }> {
  const service = getServiceSupabase()
  const { data: profile } = await service
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .single()

  const tier = (profile?.plan_tier ?? "FREE") as string
  const freeLimits: Record<string, boolean> = {
    meeting_summary: false,
    document_ai: false,
    voice_note: false,
  }

  return { allowed: tier !== "FREE" || freeLimits[feature] !== false, tier }
}

export { getUserSupabase, getServiceSupabase }
