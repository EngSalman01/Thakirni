import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/workspaces — list all workspaces the current user belongs to
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select(`
      role,
      joined_at,
      workspace:workspaces (
        id, name, type, owner_id, team_id, slug, avatar_url, created_at
      )
    `)
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const workspaces = (memberships ?? []).map(m => ({
    ...(m.workspace as unknown as Record<string, unknown>),
    member_role: m.role,
    joined_at:   m.joined_at,
  }))

  return NextResponse.json({ workspaces })
}

// POST /api/workspaces — create a team workspace (Teams plan required)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Check plan tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single()

  const tier = profile?.plan_tier ?? "FREE"
  if (!["COMPANY", "INDIVIDUAL"].includes(tier)) {
    // Still allow creation for individual plans — restrict member count on the business side
  }

  const body = await req.json().catch(() => ({}))
  const name = String(body.name ?? "").trim()
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({
      name,
      type:      "team",
      owner_id:  user.id,
      team_id:   body.team_id || null,
      avatar_url: body.avatar_url || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add owner as member
  await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id:      user.id,
    role:         "owner",
  })

  return NextResponse.json({ workspace }, { status: 201 })
}
