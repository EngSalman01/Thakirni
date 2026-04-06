/**
 * B2B upsell cron — weekly.
 *
 * Detects team workspaces with ≥ 3 active members on FREE or PRO
 * and sends the workspace owner a WhatsApp message about Teams plan.
 *
 * Anti-spam: once per workspace per 14 days (via nudge_log, workspace_id as user_id).
 */

import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const supabase = createServiceClient()

  // Find team workspaces with ≥3 members that aren't on TEAMS tier
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, owner_id, name, type")
    .eq("type", "team")

  if (!workspaces || workspaces.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  let skipped = 0

  for (const ws of workspaces as {
    id: string; owner_id: string; name: string | null; type: string
  }[]) {
    try {
      // Count members
      const { count: memberCount } = await supabase
        .from("workspace_members")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", ws.id)

      if (!memberCount || memberCount < 3) { skipped++; continue }

      // Check workspace billing tier
      const { data: billing } = await supabase
        .from("workspace_billing")
        .select("plan_tier")
        .eq("workspace_id", ws.id)
        .single()

      const tier = ((billing as { plan_tier: string } | null)?.plan_tier ?? "FREE").toUpperCase()
      if (tier === "TEAMS") { skipped++; continue }

      // Anti-spam: max once per 14 days per workspace
      const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const { data: alreadySent } = await supabase
        .from("nudge_log")
        .select("id")
        .eq("user_id", ws.owner_id)
        .eq("nudge_type", "b2b_upsell")
        .gte("sent_at", since14d)
        .limit(1)

      if ((alreadySent ?? []).length > 0) { skipped++; continue }

      // Get owner profile
      const { data: owner } = await supabase
        .from("profiles")
        .select("full_name, phone_number, preferred_language")
        .eq("id", ws.owner_id)
        .single()

      if (!owner?.phone_number) { skipped++; continue }

      const isArabic = (owner.preferred_language ?? "ar") !== "en"
      const firstName = (owner.full_name ?? "").split(" ")[0] || (isArabic ? "صاحبي" : "there")
      const wsName = ws.name || (isArabic ? "الفريق" : "your team")

      const message = isArabic
        ? [
            `هلا ${firstName} 👋`,
            "",
            `واضح فريق "${wsName}" نشيط — عندكم ${memberCount} مستخدم 👀`,
            "",
            "تبغى تفعّل مميزات الشركات؟",
            "• مساحة مشتركة غير محدودة",
            "• تقارير فريق أسبوعية",
            "• أولوية في الدعم",
            "",
            `ترقى الحين: ${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
          ].join("\n")
        : [
            `Hey ${firstName} 👋`,
            "",
            `Looks like "${wsName}" is active — you have ${memberCount} members 👀`,
            "",
            "Want to unlock Teams features?",
            "• Unlimited shared workspace",
            "• Weekly team reports",
            "• Priority support",
            "",
            `Upgrade now: ${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
          ].join("\n")

      await sendWhatsAppMessage(owner.phone_number, message)
      await supabase.from("nudge_log").insert({
        user_id: ws.owner_id,
        nudge_type: "b2b_upsell",
        channel: "whatsapp",
      })

      // Track analytics
      supabase.from("analytics_events").insert({
        user_id: ws.owner_id,
        event_name: "upgrade_nudge_shown",
        properties: { type: "b2b_upsell", member_count: memberCount, workspace_id: ws.id },
      }).then(undefined, () => {})

      sent++
      console.log(`[Cron/B2BUpsell] sent | workspace=${ws.id} members=${memberCount}`)

    } catch (err) {
      console.error(`[Cron/B2BUpsell] failed workspace ${ws.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
