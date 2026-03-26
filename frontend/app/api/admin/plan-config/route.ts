import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { updatePaddlePrice, createPaddlePrice } from "@/lib/paddle/service";

const DEFAULT_PLANS = [
  {
    plan_key: "free",
    display_name: "Free",
    price_sar: 0,
    paddle_price_id: null,
    features: [
      "10 plans per day",
      "25 memories",
      "1 project",
      "Basic AI chat",
      "Habit & goal tracking",
    ],
    is_active: true,
  },
  {
    plan_key: "pro",
    display_name: "Pro",
    price_sar: 30,
    paddle_price_id: null,
    features: [
      "100 plans per day",
      "1,000 memories",
      "10 projects",
      "30 meeting summaries/month",
      "50 document AI/month",
      "300 min voice/month",
      "Analytics & reports",
    ],
    is_active: true,
  },
  {
    plan_key: "teams",
    display_name: "Teams",
    price_sar: 60,
    paddle_price_id: null,
    features: [
      "Everything unlimited",
      "Unlimited team members",
      "Unlimited projects",
      "Unlimited meeting summaries",
      "Shared memories & notes",
      "Priority support",
    ],
    is_active: true,
  },
];

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createServiceClient();
  const { data, error: dbError } = await supabase
    .from("plan_config")
    .select("*")
    .order("price_sar", { ascending: true });

  if (dbError) {
    // Table may not exist yet — seed and return defaults
    await supabase.from("plan_config").insert(DEFAULT_PLANS).select();
    return NextResponse.json(DEFAULT_PLANS);
  }

  if (!data || data.length === 0) {
    // Seed defaults
    const { error: insertError } = await supabase
      .from("plan_config")
      .insert(DEFAULT_PLANS);
    if (insertError) {
      // Table may not exist yet — return defaults anyway
      return NextResponse.json(DEFAULT_PLANS);
    }
    return NextResponse.json(DEFAULT_PLANS);
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json() as {
    planKey?: string;
    displayName?: string;
    priceSar?: number;
    paddlePriceId?: string | null;
    paddleProductId?: string | null;
    features?: string[];
    isActive?: boolean;
  };

  const { planKey, displayName, priceSar, paddlePriceId, paddleProductId, features, isActive } = body;
  if (!planKey) {
    return NextResponse.json({ error: "planKey is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error: updateError } = await supabase
    .from("plan_config")
    .update({
      display_name: displayName,
      price_sar: priceSar,
      paddle_price_id: paddlePriceId,
      paddle_product_id: paddleProductId,
      features,
      is_active: isActive,
    })
    .eq("plan_key", planKey);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Sync price to Paddle if a price ID and amount are provided
  let paddleWarning: string | undefined;
  if (paddlePriceId && priceSar !== undefined) {
    const paddleResult = await updatePaddlePrice(paddlePriceId, priceSar);
    if (!paddleResult.success) {
      paddleWarning = paddleResult.error;
    }
  }

  return NextResponse.json({ success: true, paddleWarning });
}

// POST /api/admin/plan-config — create a new Paddle price for a plan
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json() as {
    planKey: string;
    productId: string;
    billingInterval?: "month" | "year";
    billingFrequency?: number;
  };

  const { planKey, productId, billingInterval = "month", billingFrequency = 1 } = body;
  if (!planKey || !productId) {
    return NextResponse.json({ error: "planKey and productId are required" }, { status: 400 });
  }

  // Fetch current plan to get price and display name
  const supabase = createServiceClient();
  const { data: plan, error: fetchError } = await supabase
    .from("plan_config")
    .select("price_sar, display_name")
    .eq("plan_key", planKey)
    .single();

  if (fetchError || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Create price in Paddle
  const result = await createPaddlePrice(
    productId,
    plan.price_sar,
    `${plan.display_name} - ${billingInterval === "year" ? "Annual" : "Monthly"}`,
    { frequency: billingFrequency, interval: billingInterval }
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Save the new price ID to DB
  const { error: saveError } = await supabase
    .from("plan_config")
    .update({ paddle_price_id: result.priceId, paddle_product_id: productId })
    .eq("plan_key", planKey);

  if (saveError) {
    console.error("[plan-config] DB update after Paddle price creation failed:", saveError);
    return NextResponse.json({ error: "Paddle price created but failed to save to DB: " + saveError.message }, { status: 500 });
  }

  return NextResponse.json({ priceId: result.priceId });
}
