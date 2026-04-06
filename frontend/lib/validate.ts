import { NextRequest } from "next/server"

// ── Constants ─────────────────────────────────────────────────────────────────

export const MAX_BODY_BYTES = 1_048_576 // 1 MB default
export const MAX_FIELD_LEN  = 10_000    // 10 KB per text field

// ── Body size guard ───────────────────────────────────────────────────────────

/**
 * Reject requests whose Content-Length header exceeds `maxBytes`.
 * Returns a 413 Response if too large, null if ok.
 * Note: Content-Length can be absent (e.g. chunked), so this is a fast
 * pre-check; the actual parse is still bounded by the stream read.
 */
export function checkContentLength(req: NextRequest, maxBytes = MAX_BODY_BYTES): Response | null {
  const len = req.headers.get("content-length")
  if (len && parseInt(len, 10) > maxBytes) {
    return Response.json({ error: "Request body too large" }, { status: 413 })
  }
  return null
}

/**
 * Parse JSON body with a size cap. Returns [body, null] on success,
 * [null, Response] on failure.
 */
export async function parseBody<T = Record<string, unknown>>(
  req: NextRequest,
  maxBytes = MAX_BODY_BYTES
): Promise<[T, null] | [null, Response]> {
  const sizeErr = checkContentLength(req, maxBytes)
  if (sizeErr) return [null, sizeErr]

  try {
    const text = await req.text()
    if (text.length > maxBytes) {
      return [null, Response.json({ error: "Request body too large" }, { status: 413 })]
    }
    const body = JSON.parse(text) as T
    return [body, null]
  } catch {
    return [null, Response.json({ error: "Invalid JSON body" }, { status: 400 })]
  }
}

// ── String sanitizers ─────────────────────────────────────────────────────────

/** Trim and enforce max length. Returns null if empty after trim. */
export function sanitizeString(value: unknown, maxLen = MAX_FIELD_LEN): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLen)
}

/** Require a non-empty string field; return 400 Response if missing. */
export function requireString(
  value: unknown,
  fieldName: string,
  maxLen = MAX_FIELD_LEN
): [string, null] | [null, Response] {
  const s = sanitizeString(value, maxLen)
  if (!s) {
    return [null, Response.json({ error: `${fieldName} is required` }, { status: 400 })]
  }
  return [s, null]
}

// ── Email ─────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 320
}

// ── UUID ──────────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id)
}

// ── IP extraction ─────────────────────────────────────────────────────────────

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}
