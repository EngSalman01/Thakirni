import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: sub } = await auth.supabase
    .from("subscriptions")
    .select("paddle_customer_id")
    .eq("user_id", auth.userId)
    .eq("status", "active")
    .single()

  if (!sub?.paddle_customer_id) return Response.json({ error: "No active subscription found" }, { status: 404 })

  const paddleBase = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
    ? "https://sandbox-buy.paddle.com"
    : "https://buy.paddle.com"
  const portalUrl = `${paddleBase}/customers/${sub.paddle_customer_id}/portal`
  return Response.json({ url: portalUrl })
}
