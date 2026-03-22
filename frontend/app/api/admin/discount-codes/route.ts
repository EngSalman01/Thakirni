import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createServiceClient();
  const { data, error: dbError } = await supabase
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json() as {
    code?: string;
    discountPercent?: number;
    maxUses?: number;
    expiresAt?: string | null;
    planKey?: string;
  };

  const { code, discountPercent, maxUses, expiresAt, planKey } = body;

  if (!code || discountPercent === undefined) {
    return NextResponse.json(
      { error: "code and discountPercent are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error: insertError } = await supabase
    .from("discount_codes")
    .insert({
      code: code.toUpperCase(),
      discount_percent: discountPercent,
      max_uses: maxUses ?? 0,
      used_count: 0,
      expires_at: expiresAt ?? null,
      plan_key: planKey ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error: updateError } = await supabase
    .from("discount_codes")
    .update({ is_active: false })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
