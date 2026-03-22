import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const supabase = createServiceClient();
  const { data, error: dbError } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const { error: authError, user } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json() as {
    title?: string;
    message?: string;
    target?: string;
    channel?: string;
  };

  const { title, message, target, channel } = body;

  if (!title || !message) {
    return NextResponse.json(
      { error: "title and message are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  let sentCount = 0;

  // Handle WhatsApp sending
  if (channel === "whatsapp" || channel === "both") {
    let phoneQuery = supabase
      .from("profiles")
      .select("phone_number")
      .like("phone_number", "966%");

    // Filter by target plan
    if (target && target !== "all") {
      if (target === "free") {
        phoneQuery = phoneQuery.or("plan_tier.eq.FREE,plan_tier.eq.INDIVIDUAL,plan_tier.is.null");
      } else if (target === "pro") {
        phoneQuery = phoneQuery.eq("plan_tier", "PRO");
      } else if (target === "teams") {
        phoneQuery = phoneQuery.or("plan_tier.eq.COMPANY,plan_tier.eq.TEAM");
      }
    }

    const { data: phoneUsers } = await phoneQuery;
    sentCount = phoneUsers?.length ?? 0;

    // TODO: implement Kapso send logic when API credentials are configured
    // const kapsoApiKey = process.env.KAPSO_API_KEY;
    // const kapsoApiUrl = process.env.KAPSO_API_URL;
    // for (const u of phoneUsers ?? []) {
    //   await fetch(`${kapsoApiUrl}/messages`, {
    //     method: "POST",
    //     headers: { Authorization: `Bearer ${kapsoApiKey}`, "Content-Type": "application/json" },
    //     body: JSON.stringify({ to: u.phone_number, message }),
    //   });
    // }
  }

  const { data, error: insertError } = await supabase
    .from("announcements")
    .insert({
      title,
      message,
      target: target ?? "all",
      channel: channel ?? "banner",
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent_count: sentCount, data });
}
