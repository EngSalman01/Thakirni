import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** POST /api/invites — send a team invite (Teams plan only) */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Rate limit: 20 invites per hour
  const rl = await limiters.upload(auth.userId) // reuse upload limiter (10/hr)
  if (!rl.success) return rateLimitResponse(rl.reset)

  const service = getServiceSupabase()

  // Verify Teams plan
  const { data: profile } = await service
    .from("profiles")
    .select("plan_tier, team_id")
    .eq("id", auth.userId)
    .single()

  if (!profile || (profile.plan_tier ?? "FREE").toUpperCase() !== "TEAMS") {
    return Response.json(
      { error: "Team invites require a Teams plan", code: "upgrade_required" },
      { status: 403 }
    )
  }

  if (!profile.team_id) {
    return Response.json(
      { error: "You are not part of a team. Create a team first." },
      { status: 400 }
    )
  }

  const body = await req.json() as { email?: string; role?: string }
  const email = body.email?.trim().toLowerCase()
  const role = (body.role ?? "member") as "admin" | "member"

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 })
  }

  if (!["admin", "member"].includes(role)) {
    return Response.json({ error: "Role must be admin or member" }, { status: 400 })
  }

  // Check for existing pending invite
  const { data: existing } = await service
    .from("team_invitations")
    .select("id, status")
    .eq("team_id", profile.team_id)
    .eq("email", email)
    .eq("status", "pending")
    .single()

  if (existing) {
    return Response.json({ error: "An active invite already exists for this email" }, { status: 409 })
  }

  // Check if already a member
  const { data: existingMember } = await service
    .from("team_members")
    .select("id")
    .eq("team_id", profile.team_id)
    .eq("user_id", (
      await service.from("profiles").select("id").eq("email", email).single()
    ).data?.id ?? "")
    .single()

  if (existingMember) {
    return Response.json({ error: "This user is already a team member" }, { status: 409 })
  }

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invite, error } = await service
    .from("team_invitations")
    .insert({
      team_id: profile.team_id,
      email,
      role,
      token,
      status: "pending",
      invited_by: auth.userId,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    console.error("[Invites] insert error:", error)
    return Response.json({ error: "Failed to create invite" }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thakirni.com"
  const inviteUrl = `${appUrl}/invite?token=${token}`

  // Send invite email (fire-and-forget)
  fetch(`${appUrl}/api/auth/welcome`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, inviteUrl, type: "invite" }),
  }).catch((e) => console.error("[Invites] email error:", e))

  return Response.json({ success: true, invite: { id: invite.id, email, role, expiresAt } }, { status: 201 })
}

/** GET /api/invites — list team invites sent by this user's team */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const service = getServiceSupabase()

  const { data: profile } = await service
    .from("profiles")
    .select("plan_tier, team_id")
    .eq("id", auth.userId)
    .single()

  if (!profile?.team_id) {
    return Response.json({ invites: [] })
  }

  const { data: invites } = await service
    .from("team_invitations")
    .select("id, email, role, status, created_at, expires_at")
    .eq("team_id", profile.team_id)
    .order("created_at", { ascending: false })
    .limit(50)

  return Response.json({ invites: invites ?? [] })
}

/** DELETE /api/invites?id=xxx — revoke an invite */
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { searchParams } = new URL(req.url)
  const inviteId = searchParams.get("id")
  if (!inviteId) return Response.json({ error: "Missing invite id" }, { status: 400 })

  const service = getServiceSupabase()

  const { data: profile } = await service
    .from("profiles")
    .select("team_id")
    .eq("id", auth.userId)
    .single()

  if (!profile?.team_id) {
    return Response.json({ error: "Not part of a team" }, { status: 403 })
  }

  const { error } = await service
    .from("team_invitations")
    .delete()
    .eq("id", inviteId)
    .eq("team_id", profile.team_id)

  if (error) return Response.json({ error: "Failed to revoke invite" }, { status: 500 })

  return Response.json({ success: true })
}
