import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  // Must be a logged-in admin
  const { error } = await requireAdmin();
  if (error) return error;

  const secret = process.env.ADMIN_CONFIRM_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_CONFIRM_SECRET not configured" }, { status: 500 });
  }

  const { password } = await req.json();
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }

  if (password !== secret) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
