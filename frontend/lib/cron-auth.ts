import { NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"

/**
 * Verify the cron Authorization header using a timing-safe comparison.
 * Prevents timing-oracle attacks that could leak the CRON_SECRET character-by-character.
 *
 * Returns true if the header matches the CRON_SECRET env var.
 * Any mismatch (missing header, wrong value, env not set) returns false.
 */
export function verifyCronSecret(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const authHeader = req.headers.get("authorization") ?? ""
  // Accept both "Bearer <secret>" and bare "<secret>"
  const provided = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : authHeader

  if (!provided) return false

  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(cronSecret)
    // timingSafeEqual requires same length; pad to avoid early exit
    if (a.length !== b.length) {
      // Constant-time: compare against itself to avoid timing leak, then return false
      timingSafeEqual(b, b)
      return false
    }
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Convenience: return a 401 Response if the cron secret doesn't match */
export function requireCronSecret(req: NextRequest): Response | null {
  if (!verifyCronSecret(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  return null
}
