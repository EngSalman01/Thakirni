import { requireCronSecret } from "@/lib/cron-auth"
import { NextRequest } from "next/server"
import { processJobs } from "@/lib/jobs/worker"

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authErr = requireCronSecret(req)
  if (authErr) return authErr

  const result = await processJobs(20)
  console.log("[cron/process-jobs]", result)
  return Response.json({ ok: true, ...result })
}
