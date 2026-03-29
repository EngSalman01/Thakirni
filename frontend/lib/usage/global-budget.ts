import { createClient } from "@supabase/supabase-js"
import { cacheGet, cacheSet } from "@/lib/cache"
import { sendAlert } from "@/lib/alerts/notify"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface BudgetCheckResult {
  allowed: boolean
  reason?: "global_budget_exceeded"
  usagePct?: number
}

const CACHE_KEY = "global_budget_check"
const CACHE_TTL = 60 // 60 seconds — recheck once per minute

/**
 * Check if the system has exceeded its global monthly request budget.
 * Cached for 60 seconds to avoid a DB hit on every request.
 * Fails open — if the check errors, requests are allowed through.
 */
export async function checkGlobalBudget(): Promise<BudgetCheckResult> {
  try {
    const cached = await cacheGet<BudgetCheckResult>(CACHE_KEY)
    if (cached !== null) return cached

    const supabase = getServiceSupabase()
    const month = new Date().toISOString().slice(0, 7)

    const [usageRes, limitsRes] = await Promise.all([
      supabase.from("system_usage").select("total_requests").eq("month", month).single(),
      supabase.from("system_limits").select("key, value"),
    ])

    const limits = Object.fromEntries(
      (limitsRes.data ?? []).map((r: { key: string; value: number }) => [r.key, Number(r.value)])
    )

    const maxRequests = limits["max_requests_per_month"] ?? 50_000
    const alertThresholdPct = (limits["alert_threshold_pct"] ?? 80) / 100
    const currentRequests = Number(usageRes.data?.total_requests ?? 0)
    const usagePct = currentRequests / maxRequests

    if (usagePct >= 1) {
      const result: BudgetCheckResult = { allowed: false, reason: "global_budget_exceeded", usagePct }
      await cacheSet(CACHE_KEY, result, CACHE_TTL)
      sendAlert({
        level: "critical",
        title: "Global Budget Exceeded",
        message: "Monthly request limit reached — all AI features blocked until next month.",
        metadata: { current: currentRequests, max: maxRequests, month },
      }).catch(() => {})
      return result
    }

    if (usagePct >= alertThresholdPct) {
      sendAlert({
        level: "warning",
        title: "Global Budget Warning",
        message: `System at ${Math.round(usagePct * 100)}% of monthly request limit.`,
        metadata: { current: currentRequests, max: maxRequests, month },
      }).catch(() => {})
    }

    const result: BudgetCheckResult = { allowed: true, usagePct }
    await cacheSet(CACHE_KEY, result, CACHE_TTL)
    return result
  } catch {
    return { allowed: true } // fail open
  }
}

/**
 * Record one request (and optional tokens) toward the global monthly counter.
 * Fire-and-forget — never throws.
 */
export async function incrementGlobalUsage(tokens = 0): Promise<void> {
  try {
    const supabase = getServiceSupabase()
    const month = new Date().toISOString().slice(0, 7)
    await supabase.rpc("increment_system_usage", {
      p_month: month,
      p_tokens: tokens,
      p_requests: 1,
    })
  } catch {
    // intentionally silent
  }
}
