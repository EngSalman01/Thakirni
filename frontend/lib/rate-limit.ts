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
 * Note: these return Promises since Upstash is async.
 */
export const limiters = {
  /** AI chat — 20 requests per minute per user */
  chat: (userId: string) => rateLimit(`chat:${userId}`, 20, 60_000),

  /** File uploads — 10 per hour per user */
  upload: (userId: string) => rateLimit(`upload:${userId}`, 10, 3_600_000),

  /** Auth / waitlist — 5 per 10 min per IP */
  auth: (ip: string) => rateLimit(`auth:${ip}`, 5, 600_000),

  /** Admin actions — 60 per minute per admin */
  admin: (userId: string) => rateLimit(`admin:${userId}`, 60, 60_000),

  /** General API — 100 per minute per user */
  api: (userId: string) => rateLimit(`api:${userId}`, 100, 60_000),
}
