import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso";

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json() as { userId?: string; message?: string };
  const { userId, message } = body;

  if (!userId || !message) {
    return NextResponse.json(
      { error: "userId and message are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("phone_number, full_name")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!profile.phone_number?.startsWith("966")) {
    return NextResponse.json(
      { error: "User does not have a valid WhatsApp number" },
      { status: 400 }
    );
  }

  if (!process.env.KAPSO_API_KEY) {
    return NextResponse.json(
      { error: "WhatsApp integration not configured (KAPSO_API_KEY missing)" },
      { status: 503 }
    );
  }

  try {
    await sendWhatsAppMessage(profile.phone_number, message);
  } catch (e) {
    console.error("[send-message] Kapso error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    to: profile.phone_number,
    name: profile.full_name,
  });
}
