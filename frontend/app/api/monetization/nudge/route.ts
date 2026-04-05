/**
 * Client-facing nudge API.
 * Used by the UpgradeNudge component to check whether to show an upgrade prompt.
 * Reads the session user (no userId needed from client).
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUpgradeNudge } from "@/lib/monetization/nudge"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ shouldShow: false })

    const featureLocked = req.nextUrl.searchParams.get("featureLocked") === "1"
    const nudge = await getUpgradeNudge(user.id, null, featureLocked)

    return NextResponse.json(nudge)
  } catch {
    return NextResponse.json({ shouldShow: false })
  }
}
