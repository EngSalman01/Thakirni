import { createClient } from "@supabase/supabase-js"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type PlanTier = "FREE" | "PRO" | "TEAMS"

export interface PlanLimits {
  plansPerDay: number | null
  memoriesTotal: number | null
  projectsTotal: number | null
  teamMembers: number | null
  meetingSummaries: number | null
  documentUploads: number | null
  voiceNoteMinutes: number | null
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
    meetingSummaries: 30,
    documentUploads: 50,
    voiceNoteMinutes: 300,
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
    monthly: { sar: 29.99, paddlePriceId: process.env.PADDLE_PRICE_PRO_MONTHLY ?? "" },
    annual: { sar: 287.99, paddlePriceId: process.env.PADDLE_PRICE_PRO_ANNUAL ?? "" },
  },
  TEAMS: {
    monthly: { sar: 59.99, paddlePriceId: process.env.PADDLE_PRICE_TEAMS_MONTHLY ?? "" },
    annual: { sar: 575.99, paddlePriceId: process.env.PADDLE_PRICE_TEAMS_ANNUAL ?? "" },
  },
}

export async function getUserPlanTier(userId: string): Promise<PlanTier> {
  const service = getServiceSupabase()
  const { data } = await service.from("profiles").select("plan_tier").eq("id", userId).single()
  const raw = (data?.plan_tier ?? "FREE") as string
  if (raw === "INDIVIDUAL") return "PRO"
  if (raw === "COMPANY") return "TEAMS"
  if (raw === "PRO" || raw === "TEAMS" || raw === "FREE") return raw as PlanTier
  return "FREE"
}

export async function getUserLimits(userId: string): Promise<PlanLimits> {
  const tier = await getUserPlanTier(userId)
  return PLAN_LIMITS[tier]
}

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
  await service.from("profiles").update({ plan_tier: planTier, updated_at: new Date().toISOString() }).eq("id", userId)
}
