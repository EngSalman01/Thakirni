import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FALLBACK = [
  { plan_key: "free",  price_sar: 0,  features: ["10 plans per day", "25 memories", "1 project", "Basic AI chat"] },
  { plan_key: "pro",   price_sar: 30, features: ["100 plans per day", "1,000 memories", "10 projects", "Analytics & reports"] },
  { plan_key: "teams", price_sar: 60, features: ["Everything unlimited", "Shared memories & notes", "Priority support"] },
];

// Public endpoint — only exposes price_sar per plan key.
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("plan_config")
      .select("plan_key, price_sar, features")
      .order("price_sar", { ascending: true });

    if (error || !data || data.length === 0) {
      console.error("[/api/plans] DB error:", error?.message ?? "empty result");
      return NextResponse.json(FALLBACK);
    }

    // Normalize plan_key to lowercase so frontend lookups always match
    const normalized = data.map((p: { plan_key: string; price_sar: number; features?: string[] }) => ({
      plan_key: p.plan_key.toLowerCase(),
      price_sar: p.price_sar,
      features: p.features ?? [],
    }));

    return NextResponse.json(normalized, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[/api/plans] Unexpected error:", err);
    return NextResponse.json(FALLBACK);
  }
}
