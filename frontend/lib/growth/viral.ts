/**
 * Viral growth utilities.
 *
 * Generates WhatsApp-native share messages and referral links.
 * Handles deduplication so we never spam users with viral CTAs.
 *
 * Anti-spam rules:
 *   - Max 1 viral CTA per user per 7 days
 *   - Only sent after genuine value moments (reminder delivered, briefing sent)
 *   - Never mid-conversation
 */

import { createClient } from "@supabase/supabase-js"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://thakirni.com"

export function getReferralLink(referralCode: string): string {
  return `${APP_URL}/r/${referralCode}`
}

/**
 * The core viral share message — Arabic WhatsApp text.
 * Short, natural, no marketing speak.
 */
export function buildShareMessageAr(referralCode: string, firstName?: string): string {
  const link = getReferralLink(referralCode)
  const intro = firstName
    ? `${firstName} جرب هذا الشيء 🔥`
    : "جرب هذا الشيء 🔥"

  return [
    intro,
    "",
    "بوت واتساب يرتب يومك، يذكرك بمهامك، ويعطيك ملخص يومي 📅",
    "",
    `ابدأ مجاناً: ${link}`,
  ].join("\n")
}

export function buildShareMessageEn(referralCode: string): string {
  const link = getReferralLink(referralCode)
  return [
    "Try this 🔥",
    "",
    "WhatsApp AI that plans your day, reminds you of tasks, and gives daily briefings 📅",
    "",
    `Start free: ${link}`,
  ].join("\n")
}

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Returns true if it's OK to send a viral CTA to this user right now.
 * False if they got one in the last 7 days.
 */
export async function shouldSendViralCTA(userId: string): Promise<boolean> {
  const service = getService()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await service
    .from("nudge_log")
    .select("id")
    .eq("user_id", userId)
    .eq("nudge_type", "viral_cta")
    .gte("sent_at", since)
    .limit(1)

  return (data ?? []).length === 0
}

/**
 * Log that a viral CTA was sent (prevents repeat within 7 days).
 */
export async function logViralCTASent(userId: string): Promise<void> {
  const service = getService()
  await Promise.all([
    service.from("nudge_log").insert({
      user_id: userId,
      nudge_type: "viral_cta",
      channel: "whatsapp",
    }),
    service.rpc("increment_viral_cta_count", { p_user_id: userId }),
    service.from("analytics_events").insert({
      user_id: userId,
      event_name: "referral_link_copied",
      properties: { source: "whatsapp_cta" },
    }),
  ]).catch(() => {})
}

/**
 * Build the complete viral append — a short 2-line CTA with referral link.
 * Appended to value-moment messages (after reminder, after briefing).
 *
 * Returns null if user shouldn't receive a CTA now.
 */
export async function buildViralAppend(
  userId: string,
  referralCode: string,
  isArabic: boolean
): Promise<string | null> {
  const ok = await shouldSendViralCTA(userId)
  if (!ok) return null

  const link = getReferralLink(referralCode)

  return isArabic
    ? `\n\n━━━━\nتبغى خويك يستفيد زيك؟ 👀\n${link}`
    : `\n\n━━━━\nKnow someone who'd benefit? 👀\n${link}`
}
