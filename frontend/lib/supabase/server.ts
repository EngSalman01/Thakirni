import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client factory.
 * - Uses anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) with user cookies for authentication
 * - This allows server actions to authenticate as the logged-in user
 * - RLS policies will be enforced based on the authenticated user
 *
 * For admin operations that need to bypass RLS, use createServiceClient() below.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

/**
 * Service role client — bypasses RLS and grants entirely.
 * ONLY use this in server-side API routes for tables that are
 * never directly accessible from the browser (user_facts, conversations, timeline_events).
 * Never expose this client or the service role key to the browser.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}