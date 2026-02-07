import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Implement Google Calendar Sync Logic
  // 1. Get Google OAuth Token from Supabase session provider_token
  // 2. Initialize google.calendar client
  // 3. Fetch events
  // 4. Insert into 'plans' table

  return NextResponse.json({ message: "Sync functionality coming soon!" });
}
