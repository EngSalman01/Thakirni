import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { Paddle } from "@paddle/paddle-node-sdk";

function getPaddle() {
  const key = process.env.PADDLE_API_SECRET_KEY;
  if (!key) return null;
  return new Paddle(key);
}

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

  // Insert into our DB first
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

  // Auto-sync to Paddle
  const paddle = getPaddle();
  let paddleSynced = false;
  let paddleError: string | null = null;

  if (paddle) {
    try {
      await paddle.discounts.create({
        code: code.toUpperCase(),
        description: planKey ? `${planKey} plan discount` : "Promo discount",
        type: "percentage",
        amount: String(discountPercent),
        enabledForCheckout: true,
        recur: true,
        usageLimit: maxUses && maxUses > 0 ? maxUses : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      paddleSynced = true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown Paddle error";
      // Don't fail the whole request — code is already in our DB
      paddleError = msg;
      console.error("[discount-codes] Paddle sync failed:", msg);
    }
  }

  return NextResponse.json({ ...data, paddleSynced, paddleError });
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

  // Get the code value so we can archive it in Paddle too
  const { data: codeRow } = await supabase
    .from("discount_codes")
    .select("code")
    .eq("id", id)
    .single();

  const { error: updateError } = await supabase
    .from("discount_codes")
    .update({ is_active: false })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Archive in Paddle (best effort)
  if (codeRow?.code) {
    const paddle = getPaddle();
    if (paddle) {
      try {
        // Find the discount by code and archive it
        const list = await paddle.discounts.list({ code: [codeRow.code] });
        const paddleDiscount = list.data?.[0];
        if (paddleDiscount?.id) {
          await paddle.discounts.update(paddleDiscount.id, { status: "archived" });
        }
      } catch (e) {
        console.error("[discount-codes] Paddle archive failed:", e instanceof Error ? e.message : e);
      }
    }
  }

  return NextResponse.json({ success: true });
}
