/**
 * Consistent API error responses.
 * - Never leaks stack traces or internal details to clients.
 * - Logs full details server-side.
 */

import { NextResponse } from "next/server"
import { logger } from "./logger"

export function apiError(
  message: string,
  status: number,
  meta?: Record<string, unknown>
): NextResponse {
  if (meta) logger.warn(message, { status, ...meta })
  return NextResponse.json({ error: message }, { status })
}

export function apiServerError(
  err: unknown,
  context?: string
): NextResponse {
  const msg = err instanceof Error ? err.message : String(err)
  logger.error(context ?? "API error", { error: msg })
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
}

/** Standard 401 */
export const unauthorizedError = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 })

/** Standard 403 */
export const forbiddenError = () =>
  NextResponse.json({ error: "Forbidden" }, { status: 403 })

/** Standard 400 with field-level details */
export const validationError = (details: string) =>
  NextResponse.json({ error: "Validation failed", details }, { status: 400 })
