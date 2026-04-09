import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip entirely for cron endpoints — they authenticate via CRON_SECRET header
  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );


  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /vault routes
  if (pathname.startsWith("/vault") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Block unverified users from /vault
  if (pathname.startsWith("/vault") && user && !user.email_confirmed_at) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("message", "verify");
    return NextResponse.redirect(url);
  }

  // Protect /admin routes — user must be logged in AND have is_admin = true
  // /admin/login is the entry point and must remain publicly accessible
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    // Verify admin role — redirect non-admins back to vault
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (!profileRow?.is_admin) {
        const url = request.nextUrl.clone();
        url.pathname = "/vault";
        return NextResponse.redirect(url);
      }
    } catch {
      // If profile lookup fails, deny access
      const url = request.nextUrl.clone();
      url.pathname = "/vault";
      return NextResponse.redirect(url);
    }
  }

  // Redirect new (non-onboarded) users to /onboarding before they can access /vault
  if (pathname.startsWith("/vault") && user) {
    // Fast path: 30-day cookie set after markOnboarded() or after DB confirmation
    const onboardedCookie = request.cookies.get("onboarded")
    if (!onboardedCookie?.value) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded_at")
          .eq("id", user.id)
          .single()
        if (!profile?.onboarded_at) {
          const url = request.nextUrl.clone()
          url.pathname = "/onboarding"
          return NextResponse.redirect(url)
        }
        // DB confirms onboarded — cache in a 30-day cookie to skip DB on future requests
        supabaseResponse.cookies.set("onboarded", "1", {
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
          sameSite: "lax",
          httpOnly: false,
        })
      } catch {
        // If column doesn't exist yet (migration not run), skip
      }
    }
  }

  // Maintenance mode check for /vault routes
  if (pathname.startsWith("/vault") && user) {
    try {
      const { data: maintenanceRow } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

      if (maintenanceRow?.value === "true") {
        // Check if user is admin
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (!profileRow?.is_admin) {
          const url = request.nextUrl.clone();
          url.pathname = "/maintenance";
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // If app_config table doesn't exist yet, skip maintenance check
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
