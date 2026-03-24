import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Public endpoint — returns only price_sar and is_active per plan (no sensitive data)
export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("plan_config")
      .select("plan_key, price_sar, is_active")
      .order("price_sar", { ascending: true });

    if (error || !data || data.length === 0) {
      // Return defaults so the landing page never breaks
      return NextResponse.json([
        { plan_key: "free", price_sar: 0, is_active: true },
        { plan_key: "pro", price_sar: 30, is_active: true },
        { plan_key: "teams", price_sar: 60, is_active: true },
      ]);
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json([
      { plan_key: "free", price_sar: 0, is_active: true },
      { plan_key: "pro", price_sar: 30, is_active: true },
      { plan_key: "teams", price_sar: 60, is_active: true },
    ]);
  }
}
