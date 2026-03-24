import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Must be authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json() as { code?: string };
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const service = createServiceClient();

  // Re-validate before incrementing (prevents double-use from race)
  const { data } = await service
    .from("discount_codes")
    .select("id, max_uses, used_count, is_active, expires_at")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (!data || !data.is_active) return NextResponse.json({ success: false });
  if (data.expires_at && new Date(data.expires_at) < new Date()) return NextResponse.json({ success: false });
  if (data.max_uses > 0 && data.used_count >= data.max_uses) return NextResponse.json({ success: false });

  await service
    .from("discount_codes")
    .update({ used_count: data.used_count + 1 })
    .eq("id", data.id);

  return NextResponse.json({ success: true });
}
