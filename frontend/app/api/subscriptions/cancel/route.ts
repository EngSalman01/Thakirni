import { NextRequest } from "next/server"
import { requireAuth, getServiceSupabase } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const service = getServiceSupabase()
  const { data: sub } = await service
    .from("subscriptions")
    .select("paddle_subscription_id")
    .eq("user_id", auth.userId)
    .eq("status", "active")
    .single()

  if (!sub?.paddle_subscription_id) return Response.json({ error: "No active subscription found" }, { status: 404 })

  await service
    .from("subscriptions")
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq("user_id", auth.userId)
    .eq("status", "active")

  return Response.json({ success: true, message: "Subscription will cancel at period end" })
}
