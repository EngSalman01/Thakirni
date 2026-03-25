import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// In-memory rate limit: 1 submission per IP per minute
const recentSubmissions = new Map<string, number>()

export async function POST(req: NextRequest) {
  const contactEmail = process.env.CONTACT_EMAIL
  if (!contactEmail) {
    return NextResponse.json({ error: "Contact not configured" }, { status: 503 })
  }

  // Rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const now = Date.now()
  if (now - (recentSubmissions.get(ip) ?? 0) < 60_000) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  // Verify hCaptcha token
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET
  if (hcaptchaSecret) {
    const token = String(body.hcaptchaToken ?? "")
    if (!token) {
      return NextResponse.json({ error: "Please complete the captcha" }, { status: 400 })
    }
    const verify = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${hcaptchaSecret}&response=${token}`,
    })
    const result = await verify.json()
    if (!result.success) {
      return NextResponse.json({ error: "Captcha verification failed. Please try again." }, { status: 400 })
    }
  }

  const name    = String(body.name    ?? "").trim()
  const email   = String(body.email   ?? "").trim()
  const message = String(body.message ?? "").trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 })
  }

  recentSubmissions.set(ip, now)

  const safeMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")

  const { error } = await resend.emails.send({
    from: "Thakirni Contact <info@thakirni.com>",
    to: contactEmail,
    replyTo: email,
    subject: `[Thakirni] رسالة جديدة من ${name}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f6f3f2;padding:32px;border-radius:16px;">
        <div style="background:linear-gradient(135deg,#2552ca,#ad1d7f);border-radius:12px;padding:28px 32px;margin-bottom:28px;">
          <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;">ذكّرني</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;letter-spacing:2px;">THAKIRNI · NEW CONTACT MESSAGE</div>
        </div>
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:16px 20px;color:#64748b;font-size:13px;font-weight:600;width:90px;">Name</td>
            <td style="padding:16px 20px;color:#0f172a;font-weight:600;">${name}</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:16px 20px;color:#64748b;font-size:13px;font-weight:600;">Email</td>
            <td style="padding:16px 20px;"><a href="mailto:${email}" style="color:#2552ca;text-decoration:none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding:16px 20px;color:#64748b;font-size:13px;font-weight:600;vertical-align:top;">Message</td>
            <td style="padding:16px 20px;color:#1e293b;line-height:1.7;">${safeMessage}</td>
          </tr>
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center;">
          Hit "Reply" to respond directly to ${name}.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error("[contact] Resend error:", error)
    return NextResponse.json({ error: "Failed to send. Please try again." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
