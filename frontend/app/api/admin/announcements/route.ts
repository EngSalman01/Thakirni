import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso";

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
    const validPhones = (phoneUsers ?? []).filter((u) => u.phone_number);

    if (validPhones.length > 0 && process.env.KAPSO_API_KEY) {
      const results = await Promise.allSettled(
        validPhones.map((u) => sendWhatsAppMessage(u.phone_number!, message))
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        console.error(`[announcements] ${failed.length}/${results.length} WhatsApp sends failed`);
      }
      sentCount = results.filter((r) => r.status === "fulfilled").length;
    } else {
      sentCount = 0;
    }
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
