import { createClient } from "@supabase/supabase-js"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Check if a feature flag is enabled. Defaults to false on error. */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const service = getServiceSupabase()
    const { data } = await service
      .from("feature_flags")
      .select("enabled")
      .eq("key", key)
      .single()
    return data?.enabled === true
  } catch {
    return false
  }
}

/** Check rollout percentage for gradual rollouts (0-100). */
export async function isFeatureEnabledForUser(
  key: string,
  userId: string
): Promise<boolean> {
  try {
    const service = getServiceSupabase()
    const { data } = await service
      .from("feature_flags")
      .select("enabled, rollout_percentage")
      .eq("key", key)
      .single()

    if (!data?.enabled) return false
    if (data.rollout_percentage >= 100) return true

    // Deterministic bucketing based on userId
    const hash = userId
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return hash % 100 < data.rollout_percentage
  } catch {
    return false
  }
}
