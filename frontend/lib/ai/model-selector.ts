/**
 * Returns the appropriate Gemini model name based on plan tier and optional usage ratio.
 * Returns a model name string — callers pass this directly to the Gemini REST API.
 *
 * FREE:        gemini-2.5-flash-lite   (fast, low cost)
 * PRO / TEAMS: gemini-2.5-flash        (full quality; drops to lite at ≥90% monthly usage)
 */
export function getModelForTier(tier: string, usageRatio?: number): string {
  const normalized = tier.toUpperCase()

  if (normalized === "PRO" || normalized === "TEAMS") {
    if (usageRatio !== undefined && usageRatio >= 0.9) return "gemini-2.5-flash-lite"
    return "gemini-2.5-flash"
  }

  // FREE or unknown — Lite model
  return "gemini-2.5-flash-lite"
}
