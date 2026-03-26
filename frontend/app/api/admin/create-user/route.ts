import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { limiters, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Only admins can create users
  const { user: adminUser, error: adminError } = await requireAdmin();
  if (adminError) return adminError;

  // Rate-limit admin actions (60/min)
  const rl = await limiters.admin(adminUser!.id);
  if (!rl.success) return rateLimitResponse(rl.reset);

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, isAdmin } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Create user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Set admin role if specified
    if (isAdmin && authData.user) {
      const { error: updateError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email,
          role: "admin",
          is_admin: true,
        });

      if (updateError) {
        console.error("Error setting admin role:", updateError);
        // Auth user was created — roll back by deleting to avoid orphaned auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: "Failed to set admin role: " + updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          isAdmin,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
