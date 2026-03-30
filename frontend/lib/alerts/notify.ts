import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

type AlertLevel = "info" | "warning" | "error" | "critical"

interface Alert {
  level: AlertLevel
  title: string
  message: string
  metadata?: Record<string, unknown>
}

const EMOJI: Record<AlertLevel, string> = {
  info:     "ℹ️",
  warning:  "⚠️",
  error:    "🔴",
  critical: "🚨",
}

const ADMIN_PHONE = process.env.ADMIN_WHATSAPP_PHONE!

/**
 * Send an alert via WhatsApp to the admin phone number.
 * Fire-and-forget — never throws.
 */
export async function sendAlert(alert: Alert): Promise<void> {
  try {
    const emoji = EMOJI[alert.level]
    const metaLines = alert.metadata
      ? Object.entries(alert.metadata).map(([k, v]) => `• ${k}: ${v}`).join("\n")
      : ""

    const text = [
      `${emoji} *${alert.title}*`,
      alert.message,
      metaLines,
    ].filter(Boolean).join("\n")

    await sendWhatsAppMessage(ADMIN_PHONE, text)
  } catch (err) {
    console.error("[alerts] Failed to send alert:", err)
  }
}
