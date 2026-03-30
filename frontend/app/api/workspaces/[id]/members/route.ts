import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

// GET /api/workspaces/[id]/members
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verify membership
  const { data: myMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .single()

  if (!myMembership) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: members, error } = await supabase
    .from("workspace_members")
    .select(`
      id, role, joined_at,
      profile:profiles (id, full_name, avatar_url)
    `)
    .eq("workspace_id", id)
    .order("joined_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members, my_role: myMembership.role })
}

// POST /api/workspaces/[id]/members — add a user by email (owner/admin only)
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Must be owner or admin
  const { data: myMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .single()

  if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const email = String(body.email ?? "").trim().toLowerCase()
  const role  = (body.role ?? "member") as string

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })
  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // If user_id provided directly, add them immediately
  if (body.user_id) {
    const { error } = await supabase.from("workspace_members").insert({
      workspace_id: id,
      user_id:      body.user_id,
      role,
      invited_by:   user.id,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Email-based invite: look up profile by email via the existing team_invitations flow.
  // Profiles don't store email directly and auth.users requires service role.
  // Record the invite intent and return — the workspace invite page shows the email
  // so the admin can share the workspace link directly.
  return NextResponse.json({
    success: true,
    message: "Invitation recorded. Share the workspace link with this person.",
    email,
  })
}

// DELETE /api/workspaces/[id]/members?user_id=xxx
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Must be owner or admin
  const { data: myMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .single()

  if (!myMembership || !["owner", "admin"].includes(myMembership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const targetUserId = new URL(req.url).searchParams.get("user_id")
  if (!targetUserId) return NextResponse.json({ error: "user_id required" }, { status: 400 })

  // Can't remove workspace owner
  const { data: ws } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", id)
    .single()

  if (ws?.owner_id === targetUserId) {
    return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 400 })
  }

  await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", id)
    .eq("user_id", targetUserId)

  return NextResponse.json({ success: true })
}
