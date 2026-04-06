import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso"

// POST /api/cron/customer-health
// Run daily. Computes health scores and sends outreach to at-risk users.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all users who signed up > 3 days ago and haven't been scored today
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone_number, created_at, last_active_at")
    .is("deleted_at", null)  // skip soft-deleted
    .lt("created_at", new Date(Date.now() - 3 * 86400_000).toISOString())

  if (error || !users) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000).toISOString()

  let processed = 0
  let atRisk = 0

  for (const user of users) {
    try {
      // Count activity in last 30 days
      const [sessRes, msgRes, memRes] = await Promise.all([
        supabase.from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", thirtyDaysAgo),
        supabase.from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("role", "user")
          .gte("created_at", thirtyDaysAgo),
        supabase.from("memories")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", thirtyDaysAgo),
      ])

      const sessions = sessRes.count ?? 0
      const messages = msgRes.count ?? 0
      const memories = memRes.count ?? 0

      await supabase.rpc("upsert_customer_health", {
        p_user_id:     user.id,
        p_sessions:    sessions,
        p_messages:    messages,
        p_memories:    memories,
        p_last_active: user.last_active_at ?? user.created_at,
      })

      processed++

      // Check if at-risk (score will be low) and has phone for outreach
      const score = Math.min(100,
        Math.min(40, sessions * 4) +
        Math.min(30, messages * 2) +
        Math.min(30, memories * 3)
      )

      if (score < 25 && user.phone_number) {
        // Check last outreach to avoid spamming (once per 14 days)
        const { data: health } = await supabase
          .from("customer_health")
          .select("reached_out_at")
          .eq("user_id", user.id)
          .single()

        const lastOutreach = health?.reached_out_at
          ? new Date(health.reached_out_at)
          : null
        const daysSince = lastOutreach
          ? (now.getTime() - lastOutreach.getTime()) / 86400_000
          : 999

        if (daysSince > 14) {
          const name = user.full_name?.split(" ")[0] ?? "عزيزي المستخدم"
          const phone = user.phone_number.startsWith("966")
            ? user.phone_number
            : `966${user.phone_number.replace(/^0/, "")}`

          await sendWhatsAppMessage(
            phone,
            `مرحباً ${name} 👋\n\nلاحظنا أنك لم تستخدم ذكرني مؤخراً.\n\nهل تحتاج مساعدة في البداية؟ نحن هنا لمساعدتك. تواصل معنا مباشرةً أو زر thakirni.com/help\n\nفريق ذكرني 🧠`
          ).catch(() => {})

          await supabase
            .from("customer_health")
            .update({ reached_out_at: now.toISOString() })
            .eq("user_id", user.id)

          atRisk++
        }
      }
    } catch {
      // Continue processing other users
    }
  }

  return NextResponse.json({
    processed,
    at_risk_outreach: atRisk,
    timestamp: now.toISOString(),
  })
}
