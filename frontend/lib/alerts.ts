/**
 * Alert system — sends email notifications for critical errors.
 * Uses Resend (already installed). Set ALERT_EMAIL in env vars.
 */

import { Resend } from "resend"
import { logger } from "./logger"

const resend = new Resend(process.env.RESEND_API_KEY)
const ALERT_TO = process.env.ALERT_EMAIL ?? "salman.rm03@gmail.com"
const ALERT_FROM = process.env.ALERT_FROM_EMAIL ?? "alerts@thakirni.com"

export interface AlertOptions {
  title: string
  message: string
  severity?: "low" | "medium" | "high" | "critical"
  context?: Record<string, unknown>
}

/**
 * Send a critical alert email. Fire-and-forget — never throws.
 * Only sends in production to avoid alert spam in development.
 */
export async function sendAlert(options: AlertOptions): Promise<void> {
  const { title, message, severity = "high", context } = options

  logger.error(`[ALERT] ${title}`, { severity, message, ...context })

  if (process.env.NODE_ENV !== "production") return
  if (!process.env.RESEND_API_KEY) return

  const severityColor: Record<string, string> = {
    low: "#64748b",
    medium: "#f59e0b",
    high: "#ef4444",
    critical: "#7c3aed",
  }

  const color = severityColor[severity]
  const contextHtml = context
    ? `<pre style="background:#f1f5f9;padding:12px;border-radius:8px;font-size:12px;overflow:auto;">${JSON.stringify(context, null, 2)}</pre>`
    : ""

  try {
    await resend.emails.send({
      from: ALERT_FROM,
      to: ALERT_TO,
      subject: `[${severity.toUpperCase()}] Thakirni Alert: ${title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:${color};color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:18px;">[${severity.toUpperCase()}] ${title}</h2>
            <p style="margin:4px 0 0;font-size:12px;opacity:0.8;">${new Date().toISOString()}</p>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;padding:20px 24px;border-radius:0 0 8px 8px;">
            <p style="color:#374151;margin:0 0 16px;">${message}</p>
            ${contextHtml}
            <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Thakirni Production · thakirni.com</p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    // Never let alerting break the app
    logger.warn("Failed to send alert email", { err: String(err), title })
  }
}

/**
 * Wrap an async function and alert if it throws.
 * Returns null on failure instead of throwing.
 */
export async function withAlert<T>(
  fn: () => Promise<T>,
  alertTitle: string,
  context?: Record<string, unknown>
): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    await sendAlert({
      title: alertTitle,
      message: err instanceof Error ? err.message : String(err),
      severity: "high",
      context,
    })
    return null
  }
}
