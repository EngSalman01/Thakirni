/**
 * Returns the appropriate Gemini model name based on plan tier and optional usage ratio.
 * Returns a model name string — callers pass this directly to the Gemini REST API.
 */
export function getModelForTier(tier: string, usageRatio?: number): string {
  const normalized = tier.toUpperCase()

  if (normalized === "FREE") return "gemini-2.5-flash-lite"

  if (normalized === "PRO") {
    // Drop to lite model when > 90% monthly budget consumed
    if (usageRatio !== undefined && usageRatio >= 0.9) return "gemini-2.5-flash-lite"
    return "gemini-2.5-flash-lite"
  }

  if (normalized === "TEAMS") return "gemini-2.5-flash-lite"

  // Unknown / legacy tier — treat as FREE
  return "gemini-2.5-flash-lite"
}
