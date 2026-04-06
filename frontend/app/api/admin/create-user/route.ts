import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { parseBody, isValidEmail, sanitizeString } from "@/lib/validate";

export async function POST(req: NextRequest) {
  // requireAdmin() already applies 60/min rate limit
  const { error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Missing Supabase environment variables" }, { status: 500 });
  }

  const [body, parseErr] = await parseBody<Record<string, unknown>>(req, 4096);
  if (parseErr) return parseErr;

  const email = sanitizeString(body.email, 320);
  const password = typeof body.password === "string" ? body.password : null;
  const isAdmin = body.isAdmin === true;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || password.length < 12) {
    return NextResponse.json({ error: "Password must be at least 12 characters" }, { status: 400 });
  }
  if (password.length > 128) {
    return NextResponse.json({ error: "Password too long" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  if (isAdmin && authData.user) {
    const { error: updateError } = await supabase
      .from("profiles")
      .insert({ id: authData.user.id, email, role: "admin", is_admin: true });

    if (updateError) {
      console.error("Error setting admin role:", updateError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: "Failed to set admin role: " + updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { success: true, user: { id: authData.user?.id, email: authData.user?.email, isAdmin } },
    { status: 201 }
  );
}
