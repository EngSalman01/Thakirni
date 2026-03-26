import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()

  // Set plan_tier to FREE on profile
  const { error: profileError } = await service
    .from("profiles")
    .update({ plan_tier: "FREE", updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (profileError) {
    console.error("[subscriptions/downgrade] profile update error:", profileError)
    return Response.json({ error: "Failed to update plan" }, { status: 500 })
  }

  // Also cancel any active subscriptions in DB
  const { error: subError } = await service
    .from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (subError) console.error("[subscriptions/downgrade] subscription update error:", subError)

  return Response.json({ success: true })
}
