/**
 * In-memory rate limiter.
 * Works per-process (perfect for dev and single-instance prod).
 * To scale across Vercel serverless instances, swap the store for
 * Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Clean up expired entries every 60 s so memory doesn't grow unbounded
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // unix ms
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  };
}

/** Helper: build a 429 Response with Retry-After header */
export function rateLimitResponse(reset: number): Response {
  const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
  return Response.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Reset": String(reset),
      },
    }
  );
}

/**
 * Preconfigured limiters for common endpoints.
 * Usage: const result = limiters.chat(userId);
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
};
