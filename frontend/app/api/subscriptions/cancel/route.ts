import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const service = createServiceClient()

  // Get the active subscription record
  const { data: sub } = await service
    .from("subscriptions")
    .select("paddle_subscription_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!sub?.paddle_subscription_id) {
    return Response.json({ error: "No active subscription found" }, { status: 404 })
  }

  // Call Paddle API to schedule cancellation at period end
  const paddleApiKey = process.env.PADDLE_API_KEY
  if (!paddleApiKey) {
    return Response.json({ error: "Paddle not configured" }, { status: 500 })
  }

  const paddleBase =
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
      ? "https://sandbox-api.paddle.com"
      : "https://api.paddle.com"

  const paddleRes = await fetch(
    `${paddleBase}/subscriptions/${sub.paddle_subscription_id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paddleApiKey}`,
      },
      body: JSON.stringify({
        scheduled_change: { action: "cancel", effective_at: "next_billing_period" },
      }),
    }
  )

  if (!paddleRes.ok) {
    const errText = await paddleRes.text()
    console.error("[cancel] Paddle error:", errText)
    return Response.json({ error: "Failed to cancel with Paddle" }, { status: 502 })
  }

  // Mark in DB: cancel scheduled at period end
  const { error: dbError } = await service
    .from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "active")

  if (dbError) console.error("[cancel] subscription DB update error:", dbError)

  return Response.json({ success: true })
}
