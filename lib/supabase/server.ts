import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client factory.
 * - Uses anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) with user cookies for authentication
 * - This allows server actions to authenticate as the logged-in user
 * - RLS policies will be enforced based on the authenticated user
 *
 * For admin operations that need to bypass RLS, create a separate client
 * using the service role key.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon key for user authentication
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

