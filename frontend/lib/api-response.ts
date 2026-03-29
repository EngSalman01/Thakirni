/** Standard API response helpers */

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status })
}

export function err(message: string, code?: string, status = 400): Response {
  return Response.json({ success: false, error: message, ...(code ? { code } : {}) }, { status })
}

export function unauthorized(message = "Unauthorized"): Response {
  return err(message, "unauthorized", 401)
}

export function forbidden(message = "Forbidden", code = "forbidden"): Response {
  return err(message, code, 403)
}

export function upgradeRequired(feature?: string): Response {
  const msg = feature
    ? `هذه الميزة تحتاج اشتراك Pro أو أعلى`
    : "Upgrade required"
  return err(msg, "upgrade_required", 403)
}

export function limitExceeded(feature?: string): Response {
  const msg = feature
    ? `تجاوزت الحد الشهري`
    : "Monthly limit exceeded. Upgrade your plan for more."
  return err(msg, "limit_exceeded", 429)
}

export function killSwitch(): Response {
  return err("AI features are temporarily disabled.", "kill_switch", 503)
}

export function serverError(message = "Internal server error"): Response {
  return err(message, "server_error", 500)
}
