import { createClient } from "@supabase/supabase-js"
import { sendAlert } from "@/lib/alerts/notify"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface JobRow {
  id: string
  type: string
  payload: Record<string, unknown>
  attempts: number
  max_retries: number
}

async function executeJob(job: JobRow): Promise<void> {
  switch (job.type) {
    case "send_whatsapp": {
      const { sendWhatsAppMessage } = await import("@/lib/whatsapp/kapso")
      const phone = job.payload.phone as string
      const message = job.payload.message as string
      if (!phone || !message) throw new Error("Missing phone or message in payload")
      await sendWhatsAppMessage(phone, message)
      break
    }
    case "send_email":
      // Placeholder — wire up email provider here when needed
      console.log("[jobs/worker] send_email job queued but not yet implemented:", job.payload)
      break
    case "generate_summary":
      // Placeholder — wire up AI summary generation here
      console.log("[jobs/worker] generate_summary job queued but not yet implemented:", job.payload)
      break
    case "process_document":
      // Placeholder — wire up document processing here
      console.log("[jobs/worker] process_document job queued but not yet implemented:", job.payload)
      break
    default:
      throw new Error(`Unknown job type: ${job.type}`)
  }
}

async function handleJobFailure(
  job: JobRow,
  error: string,
  supabase: ReturnType<typeof getServiceSupabase>
): Promise<void> {
  const newAttempts = job.attempts + 1

  if (newAttempts >= job.max_retries) {
    // Dead-letter: mark as permanently failed
    await supabase.from("jobs").update({
      status: "failed",
      error,
      attempts: newAttempts,
      finished_at: new Date().toISOString(),
    }).eq("id", job.id)

    // Alert on job death
    sendAlert({
      level: "error",
      title: "Job Failed Permanently",
      message: `Job type "${job.type}" failed after ${newAttempts} attempts.`,
      metadata: { jobId: job.id, error: error.slice(0, 200) },
    }).catch(() => {})
  } else {
    // Exponential backoff: 2^attempts minutes (1m, 2m, 4m, 8m…)
    const backoffMs = Math.pow(2, newAttempts) * 60 * 1000
    const runAt = new Date(Date.now() + backoffMs).toISOString()
    await supabase.from("jobs").update({
      status: "pending",
      error,
      attempts: newAttempts,
      run_at: runAt,
    }).eq("id", job.id)
  }
}

/**
 * Fetch and process up to `limit` pending jobs.
 * Called by the /api/cron/process-jobs route every minute.
 */
export async function processJobs(limit = 20): Promise<{ processed: number; failed: number }> {
  const supabase = getServiceSupabase()

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, type, payload, attempts, max_retries")
    .eq("status", "pending")
    .lte("run_at", new Date().toISOString())
    .order("priority", { ascending: false })
    .order("run_at", { ascending: true })
    .limit(limit)

  if (error || !jobs?.length) return { processed: 0, failed: 0 }

  let processed = 0
  let failed = 0

  for (const job of jobs as JobRow[]) {
    // Claim the job atomically
    const { count } = await supabase
      .from("jobs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", job.id)
      .eq("status", "pending") // only claim if still pending (prevents double-processing)
      .select("id", { count: "exact", head: true })

    if (!count) continue // another worker claimed it

    try {
      await executeJob(job)
      await supabase.from("jobs").update({
        status: "done",
        finished_at: new Date().toISOString(),
      }).eq("id", job.id)
      processed++
    } catch (err) {
      await handleJobFailure(job, (err as Error).message ?? String(err), supabase)
      failed++
    }
  }

  return { processed, failed }
}
