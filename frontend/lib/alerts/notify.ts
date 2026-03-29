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

const DISCORD_COLOR: Record<AlertLevel, number> = {
  info:     0x2552ca,
  warning:  0xf59e0b,
  error:    0xef4444,
  critical: 0xdc2626,
}

/**
 * Send an alert to the configured webhook (Discord or generic Slack-style).
 * Set ALERT_WEBHOOK_URL in Vercel env vars.
 * Silently no-ops if the env var is not set.
 */
export async function sendAlert(alert: Alert): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    const emoji = EMOJI[alert.level]
    const body = webhookUrl.includes("discord.com/api/webhooks")
      ? JSON.stringify({
          embeds: [{
            title: `${emoji} ${alert.title}`,
            description: alert.message,
            color: DISCORD_COLOR[alert.level],
            timestamp: new Date().toISOString(),
            fields: alert.metadata
              ? Object.entries(alert.metadata).map(([name, value]) => ({
                  name,
                  value: String(value),
                  inline: true,
                }))
              : [],
          }],
        })
      : JSON.stringify({ text: `${emoji} *${alert.title}*\n${alert.message}` })

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
  } catch (err) {
    console.error("[alerts] Failed to send alert:", err)
  }
}
