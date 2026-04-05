/**
 * A/B Testing helpers.
 *
 * Uses existing `feature_flags` table.
 * Experiments are feature flags where:
 *   experiment_group = "my_experiment"
 *   variant_a        = "control"
 *   variant_b        = "treatment"
 *   rollout_percentage = 50  (50% each)
 *
 * Bucketing is deterministic: same userId always gets same variant.
 */

import { createClient } from "@supabase/supabase-js"

export type Variant = "a" | "b" | "control"

interface ExperimentFlag {
  enabled: boolean
  rollout_percentage: number
  variant_a: string | null
  variant_b: string | null
}

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Returns which variant a user is assigned to.
 * Returns "control" if the experiment doesn't exist or is disabled.
 *
 * Usage:
 *   const variant = await getExperimentVariant("exp_upgrade_message", userId)
 *   const message = variant === "a" ? SOFT_COPY : DIRECT_COPY
 */
export async function getExperimentVariant(
  key: string,
  userId: string
): Promise<Variant> {
  try {
    const service = getService()
    const { data } = await service
      .from("feature_flags")
      .select("enabled, rollout_percentage, variant_a, variant_b")
      .eq("key", key)
      .single()

    const flag = data as ExperimentFlag | null
    if (!flag?.enabled) return "control"

    // Deterministic bucket from userId characters
    const hash = userId
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0)

    const bucket = hash % 100

    if (bucket < (flag.rollout_percentage ?? 50)) {
      return "b"
    }
    return "a"
  } catch {
    return "control"
  }
}

/**
 * Get the actual variant text for an experiment.
 * Returns null if experiment is disabled or doesn't exist.
 */
export async function getExperimentValue(
  key: string,
  userId: string
): Promise<string | null> {
  try {
    const service = getService()
    const { data } = await service
      .from("feature_flags")
      .select("enabled, rollout_percentage, variant_a, variant_b")
      .eq("key", key)
      .single()

    const flag = data as ExperimentFlag | null
    if (!flag?.enabled) return null

    const variant = await getExperimentVariant(key, userId)
    if (variant === "a") return flag.variant_a ?? null
    if (variant === "b") return flag.variant_b ?? null
    return null
  } catch {
    return null
  }
}
