import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { limiters, rateLimitResponse } from "@/lib/rate-limit";
import { getClientIp, parseBody } from "@/lib/validate";

export async function POST(req: NextRequest) {
  // IP-based brute-force guard BEFORE admin auth (so we don't leak timing info)
  const ip = getClientIp(req);
  const rl = await limiters.verifyPassword(ip);
  if (!rl.success) return rateLimitResponse(rl.reset);

  // Must be a logged-in admin (also applies admin 60/min rate limit)
  const { error } = await requireAdmin();
  if (error) return error;

  const secret = process.env.ADMIN_CONFIRM_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_CONFIRM_SECRET not configured" }, { status: 500 });
  }

  const [body, parseErr] = await parseBody<{ password?: string }>(req, 1024);
  if (parseErr) return parseErr;

  const { password } = body;
  if (!password || typeof password !== "string" || password.length > 1024) {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }

  if (password !== secret) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
