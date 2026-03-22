import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

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
    return NextResponse.json({ error: dbError.message }, { status: 500 });
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
    features?: string[];
    isActive?: boolean;
  };

  const { planKey, displayName, priceSar, paddlePriceId, features, isActive } = body;
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
      features,
      is_active: isActive,
    })
    .eq("plan_key", planKey);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
