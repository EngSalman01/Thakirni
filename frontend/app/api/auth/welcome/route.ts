import { NextRequest, NextResponse } from "next/server"
import { sendWelcome } from "@/lib/emails"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"
import { parseBody, isValidEmail, sanitizeString } from "@/lib/validate"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const rl = await limiters.auth(ip)
  if (!rl.success) return rateLimitResponse(rl.reset)

  try {
    const [body, parseErr] = await parseBody<Record<string, unknown>>(req, 4096)
    if (parseErr) return parseErr

    const email = sanitizeString(body.email, 320)
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const name = sanitizeString(body.name, 200) ?? email.split("@")[0]
    await sendWelcome({ to: email, name })
    return NextResponse.json({ success: true })
  } catch {
    // Never block signup if email fails
    return NextResponse.json({ success: true })
  }
}
