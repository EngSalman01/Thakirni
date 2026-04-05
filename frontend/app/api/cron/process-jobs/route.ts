import { NextRequest } from "next/server"
import { processJobs } from "@/lib/jobs/worker"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace(/bearer /i, "")
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  const result = await processJobs(20)
  console.log("[cron/process-jobs]", result)
  return Response.json({ ok: true, ...result })
}
