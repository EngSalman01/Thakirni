import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp/kapso";
import { parseBody, isValidUUID, sanitizeString } from "@/lib/validate";
import { logAuditEvent } from "@/lib/compliance/audit";

export async function POST(request: NextRequest) {
  const { user: adminUser, error } = await requireAdmin();
  if (error || !adminUser) return error ?? NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [body, parseErr] = await parseBody<Record<string, unknown>>(request, 8192);
  if (parseErr) return parseErr;

  const userId = sanitizeString(body.userId, 36);
  const message = sanitizeString(body.message, 4096);

  if (!userId || !isValidUUID(userId)) {
    return NextResponse.json({ error: "Valid userId (UUID) required" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
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

  // Audit log: admin messaging a specific user
  await logAuditEvent(
    adminUser.id,
    "admin_action",
    `Admin sent WhatsApp message to user ${userId}`,
    { targetUserId: userId, messageLength: message.length }
  );

  return NextResponse.json({ success: true, to: profile.phone_number, name: profile.full_name });
}
