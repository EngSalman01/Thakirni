/**
 * Auth middleware — validates authenticated user for server-side API routes.
 * Returns the user or throws an error if not authenticated.
 */
import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function requireAuth(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return user;
}

// ── withAuth HOF for API route handlers ──────────────────────────────────────

type RouteHandler = (
  req: NextRequest,
  context: { user: { id: string; email?: string } }
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest) => {
    try {
      const user = await requireAuth(req);
      return handler(req, { user });
    } catch (e) {
      if (e instanceof Response) return e;
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
