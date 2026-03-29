export type PlanTier = "FREE" | "PRO" | "TEAMS"

export interface UsageLimits {
  // Monthly
  aiChatRequests: number
  documentUploads: number
  meetingSummaries: number
  voiceNoteMinutes: number
  maxTokensPerMonth: number
  // Daily
  plansPerDay: number
  aiChatRequestsPerDay: number
  maxRequestsPerDay: number
  // Per-request
  maxInputChars: number
}

/** Strict limits — NO unlimited usage on any plan */
export const USAGE_LIMITS: Record<PlanTier, UsageLimits> = {
  FREE: {
    aiChatRequests: 30,
    documentUploads: 0,
    meetingSummaries: 0,
    voiceNoteMinutes: 5,
    maxTokensPerMonth: 50_000,
    plansPerDay: 10,
    aiChatRequestsPerDay: 10,
    maxRequestsPerDay: 50,
    maxInputChars: 5_000,
  },
  PRO: {
    aiChatRequests: 500,
    documentUploads: 50,
    meetingSummaries: 30,
    voiceNoteMinutes: 300,
    maxTokensPerMonth: 2_000_000,
    plansPerDay: 100,
    aiChatRequestsPerDay: 100,
    maxRequestsPerDay: 500,
    maxInputChars: 20_000,
  },
  TEAMS: {
    aiChatRequests: 2_000,
    documentUploads: 200,
    meetingSummaries: 100,
    voiceNoteMinutes: 1_200,
    maxTokensPerMonth: 8_000_000,
    plansPerDay: 500,
    aiChatRequestsPerDay: 500,
    maxRequestsPerDay: 2_000,
    maxInputChars: 50_000,
  },
}

export function getLimitsForTier(tier: string): UsageLimits {
  const normalized = tier.toUpperCase() as PlanTier
  return USAGE_LIMITS[normalized] ?? USAGE_LIMITS.FREE
}
