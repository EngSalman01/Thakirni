import { createGoogleGenerativeAI } from "@ai-sdk/google"

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })

/**
 * Returns the appropriate AI model based on plan tier and optional usage ratio.
 * - FREE: cheapest lite model only
 * - PRO: standard flash model; drops to lite if > 90% monthly usage
 * - TEAMS: standard flash; can use flash for everything (no higher-quality model needed yet)
 */
export function getModelForTier(tier: string, usageRatio?: number) {
  const normalized = tier.toUpperCase()

  if (normalized === "FREE") {
    return google("gemini-2.5-flash-lite")
  }

  if (normalized === "PRO") {
    // Drop to lite model when > 90% monthly budget consumed
    if (usageRatio !== undefined && usageRatio >= 0.9) {
      return google("gemini-2.5-flash-lite")
    }
    return google("gemini-2.5-flash-lite")
  }

  if (normalized === "TEAMS") {
    return google("gemini-2.5-flash-lite")
  }

  // Unknown / legacy tier — treat as FREE
  return google("gemini-2.5-flash-lite")
}
