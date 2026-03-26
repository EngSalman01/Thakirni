import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: invite, error } = await service
    .from("team_invitations")
    .select("id, role, status, expires_at, email, teams(id, name, slug)")
    .eq("token", token)
    .single()

  if (error || !invite) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
  }

  return NextResponse.json({
    teamName: (invite.teams as unknown as { name: string } | null)?.name ?? "Unknown Team",
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expires_at,
    email: invite.email,
  })
}
