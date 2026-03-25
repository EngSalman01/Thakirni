import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in to accept this invitation" }, { status: 401 })
  }

  const { token } = await req.json() as { token?: string }
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  const service = createServiceClient()

  // Get the invitation
  const { data: invite, error: inviteError } = await service
    .from("team_invitations")
    .select("id, team_id, role, status, expires_at, email, team:teams(id, name, slug)")
    .eq("token", token)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: `Invitation is ${invite.status}` }, { status: 400 })
  }

  if (new Date(invite.expires_at) < new Date()) {
    await service.from("team_invitations").update({ status: "expired" }).eq("id", invite.id)
    return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
  }

  // Check if already a member
  const { data: existing } = await service
    .from("team_members")
    .select("id")
    .eq("team_id", invite.team_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "You are already a member of this team" }, { status: 400 })
  }

  // Add to team
  const { error: memberError } = await service
    .from("team_members")
    .insert({ team_id: invite.team_id, user_id: user.id, role: invite.role })

  if (memberError) {
    return NextResponse.json({ error: "Failed to join team" }, { status: 500 })
  }

  // Mark invitation as accepted
  await service
    .from("team_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id)

  // Update user's team_id in profile
  await service.from("profiles").update({ team_id: invite.team_id }).eq("id", user.id)

  return NextResponse.json({ success: true, teamId: invite.team_id })
}
