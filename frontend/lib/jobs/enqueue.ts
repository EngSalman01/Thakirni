import { createClient } from "@supabase/supabase-js"

export type JobType =
  | "send_email"
  | "generate_summary"
  | "process_document"
  | "send_whatsapp"

export interface EnqueueOptions {
  runAt?: Date          // schedule for future; defaults to now
  priority?: number     // higher = processed first; default 0
  maxRetries?: number   // default 3
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Enqueue a background job. Fire-and-forget.
 * The jobs table must exist (see Phase 2 SQL migration).
 */
export async function enqueueJob(
  type: JobType,
  payload: Record<string, unknown>,
  options: EnqueueOptions = {}
): Promise<string | null> {
  try {
    const service = getServiceSupabase()
    const { data, error } = await service
      .from("jobs")
      .insert({
        type,
        payload,
        status: "pending",
        run_at: (options.runAt ?? new Date()).toISOString(),
        priority: options.priority ?? 0,
        max_retries: options.maxRetries ?? 3,
      })
      .select("id")
      .single()

    if (error) throw error
    return data?.id ?? null
  } catch (err) {
    console.error("[jobs/enqueue] Failed:", err)
    return null
  }
}
