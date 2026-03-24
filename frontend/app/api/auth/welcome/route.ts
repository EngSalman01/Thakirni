import { NextRequest, NextResponse } from "next/server"
import { sendWelcome } from "@/lib/emails"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown"
  const rl = limiters.auth(ip)
  if (!rl.success) return rateLimitResponse(rl.reset)

  try {
    const { email, name } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    await sendWelcome({ to: email, name: name || email.split("@")[0] })
    return NextResponse.json({ success: true })
  } catch {
    // Never block signup if email fails
    return NextResponse.json({ success: true })
  }
}
