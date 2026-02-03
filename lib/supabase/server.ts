import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client factory.
 * - Uses server-only env vars: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY)
 * - Do NOT use NEXT_PUBLIC_* here for secret keys.
 *
 * Ensure in Vercel you set:
 * - SUPABASE_URL = https://<project-ref>.supabase.co
 * - SUPABASE_SERVICE_KEY = sb_secret_...
 *
 * If you only need non-privileged read operations as the logged-in user,
 * you may instead pass the publishable key (NEXT_PUBLIC_SUPABASE_KEY), but keep
 * service keys server-only.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!, // server-only secret
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  )
}
