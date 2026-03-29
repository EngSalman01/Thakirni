/**
 * Simple cache layer — uses Upstash Redis when available,
 * falls back to in-memory Map for local dev / single-instance.
 */

// ── In-memory fallback ────────────────────────────────────────────────────────

interface CacheEntry {
  value: unknown
  expiresAt: number
}

const memStore = new Map<string, CacheEntry>()

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memStore) {
      if (entry.expiresAt < now) memStore.delete(key)
    }
  }, 60_000)
}

// ── Upstash Redis (optional) ──────────────────────────────────────────────────

let redisClient: {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: string, opts: { ex: number }) => Promise<void>
  del: (key: string) => Promise<void>
} | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis")
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch {
    // Package not installed — fall back to in-memory
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get a cached value by key. Returns null if missing or expired.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redisClient) {
    const raw = await redisClient.get(key)
    if (raw === null || raw === undefined) return null
    try {
      return (typeof raw === "string" ? JSON.parse(raw) : raw) as T
    } catch {
      return null
    }
  }

  const entry = memStore.get(key)
  if (!entry || entry.expiresAt < Date.now()) return null
  return entry.value as T
}

/**
 * Set a value with a TTL in seconds.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (redisClient) {
    await redisClient.set(key, JSON.stringify(value), { ex: ttlSeconds })
    return
  }

  memStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

/**
 * Delete a cached value.
 */
export async function cacheDel(key: string): Promise<void> {
  if (redisClient) {
    await redisClient.del(key)
    return
  }
  memStore.delete(key)
}

/**
 * Get-or-set: returns cached value, or calls `fn` and caches the result.
 */
export async function cacheWrap<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const value = await fn()
  await cacheSet(key, value, ttlSeconds)
  return value
}
