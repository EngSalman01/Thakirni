import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { z } from "zod"

const CreateGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["career", "health", "finance", "education", "personal", "relationships", "other"]),
  target_date: z.string().optional(),
  milestones: z.array(z.object({ title: z.string(), target_date: z.string().optional() })).optional(),
})

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const status = req.nextUrl.searchParams.get("status") ?? "active"
  const query = auth.supabase.from("goals").select("*, goal_milestones(*)").order("created_at", { ascending: false })
  const { data, error } = status === "all" ? await query : await query.eq("status", status)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ goals: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await req.json()
  const parsed = CreateGoalSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { milestones, ...goalData } = parsed.data

  const { data: goal, error } = await auth.supabase
    .from("goals")
    .insert({ user_id: auth.userId, ...goalData, progress: 0, status: "active" })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (milestones?.length) {
    await auth.supabase.from("goal_milestones").insert(
      milestones.map((m, i) => ({
        goal_id: goal.id,
        user_id: auth.userId,
        title: m.title,
        position: i,
        target_date: m.target_date ?? null,
        is_completed: false,
      }))
    )
  }

  return Response.json({ success: true, goal })
}
