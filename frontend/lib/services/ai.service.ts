import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { getModelForTier } from "@/lib/ai/model-selector"

const _google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })

export function getGoogle() {
  return _google
}

/** Default model — PRO tier quality (used where no userId is available) */
export function getAiModel() {
  return _google("gemini-2.5-flash-lite")
}

/** Tier-aware model — use this in API routes where userId is known */
export function getAiModelForTier(tier: string, usageRatio?: number) {
  return getModelForTier(tier, usageRatio)
}

/** Lite model — cheapest, for FREE plan or near-limit situations */
export function getLiteModel() {
  return _google("gemini-2.5-flash-lite")
}

export function getFastModel() {
  return _google("gemini-2.5-flash-lite")
}
