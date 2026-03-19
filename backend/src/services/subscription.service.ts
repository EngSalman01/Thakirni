import { getServiceSupabase } from "../lib/supabase.js"

export type PlanTier = "FREE" | "PRO" | "TEAMS"

export interface PlanLimits {
  plansPerDay: number | null       // null = unlimited
  memoriesTotal: number | null
  projectsTotal: number | null
  teamMembers: number | null
  meetingSummaries: number | null  // per month
  documentUploads: number | null   // per month
  voiceNoteMinutes: number | null  // per month
  hasTeams: boolean
  hasDocumentAI: boolean
  hasMeetingSummary: boolean
  hasAdvancedAI: boolean
  hasAnalytics: boolean
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    plansPerDay: 10,
    memoriesTotal: 25,
    projectsTotal: 1,
    teamMembers: null,
    meetingSummaries: 0,
    documentUploads: 0,
    voiceNoteMinutes: 5,
    hasTeams: false,
    hasDocumentAI: false,
    hasMeetingSummary: false,
    hasAdvancedAI: false,
    hasAnalytics: false,
  },
  PRO: {
    plansPerDay: 100,
    memoriesTotal: 1000,
    projectsTotal: 10,
    teamMembers: null,
    meetingSummaries: 30,       // per month
    documentUploads: 50,        // per month
    voiceNoteMinutes: 300,      // per month
    hasTeams: false,
    hasDocumentAI: true,
    hasMeetingSummary: true,
    hasAdvancedAI: true,
    hasAnalytics: true,
  },
  TEAMS: {
    plansPerDay: null,
    memoriesTotal: null,
    projectsTotal: null,
    teamMembers: null,
    meetingSummaries: null,
    documentUploads: null,
    voiceNoteMinutes: null,
    hasTeams: true,
    hasDocumentAI: true,
    hasMeetingSummary: true,
    hasAdvancedAI: true,
    hasAnalytics: true,
  },
}

export const PLAN_PRICES = {
  PRO: {
    monthly: {
      usd: 9,
      paddlePriceId: process.env.PADDLE_PRICE_PRO_MONTHLY ?? "",
    },
    annual: {
      usd: 79,
      paddlePriceId: process.env.PADDLE_PRICE_PRO_ANNUAL ?? "",
    },
  },
  TEAMS: {
    monthly: {
      usd: 19,
      paddlePriceId: process.env.PADDLE_PRICE_TEAMS_MONTHLY ?? "",
    },
    annual: {
      usd: 159,
      paddlePriceId: process.env.PADDLE_PRICE_TEAMS_ANNUAL ?? "",
    },
  },
}

export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  const service = getServiceSupabase()
  const { data } = await service
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .single()

  const raw = (data?.plan_tier ?? "FREE") as string
  // Normalize legacy values
  if (raw === "INDIVIDUAL") return "PRO"
  if (raw === "COMPANY") return "TEAMS"
  if (raw === "PRO" || raw === "TEAMS" || raw === "FREE") return raw as PlanTier
  return "FREE"
}

export async function getUserLimits(userId: string): Promise<PlanLimits> {
  const tier = await getUserPlanTier(userId)
  return PLAN_LIMITS[tier]
}

export async function checkFeatureAccess(
  userId: string,
  feature: keyof Pick<PlanLimits, "hasTeams" | "hasDocumentAI" | "hasMeetingSummary" | "hasAdvancedAI" | "hasAnalytics">
): Promise<{ allowed: boolean; tier: PlanTier; limits: PlanLimits }> {
  const tier = await getUserPlanTier(userId)
  const limits = PLAN_LIMITS[tier]
  return { allowed: limits[feature] === true, tier, limits }
}

/** Sync plan tier to profile when subscription changes */
export async function syncSubscriptionToProfile(
  userId: string,
  paddlePriceId: string,
  status: string
): Promise<void> {
  const service = getServiceSupabase()

  let planTier: PlanTier = "FREE"
  if (status === "active" || status === "trialing") {
    const priceId = paddlePriceId.toLowerCase()
    if (priceId.includes("team") || priceId === process.env.PADDLE_PRICE_TEAMS_MONTHLY || priceId === process.env.PADDLE_PRICE_TEAMS_ANNUAL) {
      planTier = "TEAMS"
    } else if (priceId.includes("pro") || priceId === process.env.PADDLE_PRICE_PRO_MONTHLY || priceId === process.env.PADDLE_PRICE_PRO_ANNUAL) {
      planTier = "PRO"
    }
  }

  await service
    .from("profiles")
    .update({ plan_tier: planTier, updated_at: new Date().toISOString() })
    .eq("id", userId)
}
