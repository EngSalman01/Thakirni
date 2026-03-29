import { NextRequest } from "next/server"
import { sendAlert } from "@/lib/alerts/notify"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  await sendAlert({
    level: "info",
    title: "Test Alert ✅",
    message: "نظام التنبيهات يعمل بشكل صحيح 🎉\nAlert system is working correctly.",
    metadata: { time: new Date().toISOString(), env: "production" },
  })

  return Response.json({ ok: true })
}
