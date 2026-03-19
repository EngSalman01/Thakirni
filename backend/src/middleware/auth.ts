import { Context, Next } from "hono"
import { getUserSupabase, getServiceSupabase } from "../lib/supabase.js"
import type { AppEnv } from "../lib/types.js"

export interface AuthVariables {
  userId: string
  accessToken: string
}

/**
 * Require a valid Supabase JWT in the Authorization header.
 * Attaches userId and accessToken to the Hono context.
 */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized — missing token" }, 401)
  }

  const token = authHeader.slice(7)
  const supabase = getUserSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return c.json({ error: "Unauthorized — invalid token" }, 401)
  }

  c.set("userId", user.id)
  c.set("accessToken", token)
  await next()
}

/**
 * Check plan limits for the user.
 * Attaches planTier to context.
 */
export function checkPlanLimits(feature: string) {
  return async (c: Context<AppEnv>, next: Next) => {
    const userId = c.get("userId")
    if (!userId) return c.json({ error: "Unauthorized" }, 401)

    const service = getServiceSupabase()
    const { data: profile } = await service
      .from("profiles")
      .select("plan_tier")
      .eq("id", userId)
      .single()

    const tier = (profile?.plan_tier ?? "FREE") as string
    c.set("planTier", tier)

    // Feature gating
    const freeLimits: Record<string, boolean> = {
      meeting_summary: false,
      document_ai: false,
      voice_note: false,
      goals: true,
      habits: true,
      focus: true,
    }

    if (tier === "FREE" && freeLimits[feature] === false) {
      return c.json({
        error: "upgrade_required",
        message: "هذه الميزة تحتاج اشتراك Pro أو أعلى",
        feature,
        tier,
      }, 403)
    }

    await next()
  }
}
