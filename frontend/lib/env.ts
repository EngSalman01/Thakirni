const REQUIRED: string[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "KAPSO_WEBHOOK_SECRET",
  "PADDLE_WEBHOOK_SECRET",
  "CRON_SECRET",
]

/** Call at server startup to catch missing vars early */
export function validateEnv(): void {
  if (typeof window !== "undefined") return // client-side skip

  const missing = REQUIRED.filter((k) => !process.env[k])
  if (missing.length === 0) return

  const msg = `[Env] Missing required environment variables: ${missing.join(", ")}`
  console.error(msg)
  if (process.env.NODE_ENV === "production") {
    throw new Error(msg)
  }
}

/** Get a required env var — throws if missing */
export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}
