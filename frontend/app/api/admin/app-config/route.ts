import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

const DEFAULT_CONFIG = [
  { key: "app_name", value: "Thakirni" },
  { key: "support_whatsapp", value: "" },
  { key: "maintenance_mode", value: "false" },
  { key: "admin_email", value: "" },
];

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createServiceClient();
  const { data, error: dbError } = await supabase
    .from("app_config")
    .select("key, value");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    // Seed defaults
    const { error: insertError } = await supabase
      .from("app_config")
      .insert(DEFAULT_CONFIG);
    if (insertError) {
      // Table may not exist — return defaults as object
      const obj: Record<string, string> = {};
      DEFAULT_CONFIG.forEach((r) => { obj[r.key] = r.value; });
      return NextResponse.json(obj);
    }
    const obj: Record<string, string> = {};
    DEFAULT_CONFIG.forEach((r) => { obj[r.key] = r.value; });
    return NextResponse.json(obj);
  }

  const obj: Record<string, string> = {};
  data.forEach((r) => { obj[r.key] = r.value; });
  return NextResponse.json(obj);
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json() as { key?: string; value?: string };
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error: upsertError } = await supabase
    .from("app_config")
    .upsert({ key, value }, { onConflict: "key" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
