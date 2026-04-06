/**
 * Rate limiter — uses Upstash Redis when UPSTASH_REDIS_REST_URL is set,
 * falls back to in-memory for local dev / single-instance.
 */

// ── In-memory fallback ────────────────────────────────────────────────────────

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 60_000)
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number // unix ms
}

function rateLimitInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, reset: entry.resetAt }
}

// ── Upstash Redis (optional) ──────────────────────────────────────────────────

let upstashRatelimit: ((key: string, limit: number, windowMs: number) => Promise<RateLimitResult>) | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Ratelimit } = require("@upstash/ratelimit")
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis")

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Cache Ratelimit instances per (limit, window) combo
    const cache = new Map<string, InstanceType<typeof Ratelimit>>()

    upstashRatelimit = async (key: string, limit: number, windowMs: number) => {
      const cacheKey = `${limit}:${windowMs}`
      if (!cache.has(cacheKey)) {
        cache.set(
          cacheKey,
          new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
            prefix: "thakirni_rl",
          }),
        )
      }
      const rl = cache.get(cacheKey)!
      const result = await rl.limit(key)
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      }
    }
  } catch {
    // Package not installed — fall back to in-memory
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (upstashRatelimit) {
    return upstashRatelimit(key, limit, windowMs)
  }
  return rateLimitInMemory(key, limit, windowMs)
}

/** Helper: build a 429 Response with Retry-After header */
export function rateLimitResponse(reset: number): Response {
  const retryAfterSec = Math.ceil((reset - Date.now()) / 1000)
  return Response.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Reset": String(reset),
      },
    },
  )
}

/**
 * Preconfigured limiters for common endpoints.
 *
 * Where a workspaceId is available, use workspace-scoped keys so all members
 * of a team workspace share the same bucket. This prevents one workspace from
 * consuming another's quota and correctly pools team capacity.
 *
 * userId-only overloads remain for auth endpoints where workspace context
 * is not yet available.
 */
export const limiters = {
  /** AI chat — 20 req/min. Team members share the workspace bucket. */
  chat: (userId: string, workspaceId?: string | null) =>
    rateLimit(workspaceId ? `chat:ws:${workspaceId}` : `chat:${userId}`, 20, 60_000),

  /** File uploads — 10/hr. Team members share the workspace bucket. */
  upload: (userId: string, workspaceId?: string | null) =>
    rateLimit(workspaceId ? `upload:ws:${workspaceId}` : `upload:${userId}`, 10, 3_600_000),

  /** Auth / waitlist — 5 per 15 min per IP (no workspace context at auth time) */
  auth: (ip: string) => rateLimit(`auth:${ip}`, 5, 900_000),

  /** Admin actions — 60 req/min per admin user */
  admin: (userId: string) => rateLimit(`admin:${userId}`, 60, 60_000),

  /** General API — 100 req/min, workspace-scoped when available */
  api: (userId: string, workspaceId?: string | null) =>
    rateLimit(workspaceId ? `api:ws:${workspaceId}` : `api:${userId}`, 100, 60_000),

  /** Password / verify endpoints — 5 attempts per 15 min per IP, prevents brute-force */
  verifyPassword: (ip: string) => rateLimit(`verify:${ip}`, 5, 900_000),

  /** Destructive operations (account deletion, bulk delete) — 5 per hour per user */
  destroy: (userId: string) => rateLimit(`destroy:${userId}`, 5, 3_600_000),

  /** Contact / demo forms — 5 per hour per IP */
  form: (ip: string) => rateLimit(`form:${ip}`, 5, 3_600_000),
}
