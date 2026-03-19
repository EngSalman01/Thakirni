import { createRouter } from "../lib/types.js"
import { Hono } from "hono"
import { requireAuth } from "../middleware/auth.js"
import { getUserSupabase } from "../lib/supabase.js"
import { getAiModel } from "../services/ai.service.js"
import { generateText } from "ai"
import { z } from "zod"

export const goalsRouter = createRouter()
goalsRouter.use("*", requireAuth)

const CreateGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["career", "health", "finance", "education", "personal", "relationships", "other"]),
  target_date: z.string().optional(),
  milestones: z.array(z.object({ title: z.string(), target_date: z.string().optional() })).optional(),
})

/** POST /api/goals — create a goal */
goalsRouter.post("/", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const body = await c.req.json()

  const parsed = CreateGoalSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const { milestones, ...goalData } = parsed.data

  const { data: goal, error } = await supabase
    .from("goals")
    .insert({ user_id: userId, ...goalData, progress: 0, status: "active" })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  // Insert milestones if provided
  if (milestones?.length) {
    await supabase.from("goal_milestones").insert(
      milestones.map((m, i) => ({
        goal_id: goal.id,
        user_id: userId,
        title: m.title,
        position: i,
        target_date: m.target_date ?? null,
        is_completed: false,
      }))
    )
  }

  return c.json({ success: true, goal })
})

/** GET /api/goals — list all goals */
goalsRouter.get("/", async (c) => {
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const status = c.req.query("status") ?? "active"

  const query = supabase
    .from("goals")
    .select("*, goal_milestones(*)")
    .order("created_at", { ascending: false })

  const { data, error } = status === "all"
    ? await query
    : await query.eq("status", status)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ goals: data ?? [] })
})

/** PATCH /api/goals/:id/progress — update progress */
goalsRouter.patch("/:id/progress", async (c) => {
  const accessToken = c.get("accessToken") as string
  const userId = c.get("userId") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()
  const { progress } = await c.req.json() as { progress: number }

  const status = progress >= 100 ? "completed" : "active"

  const { data, error } = await supabase
    .from("goals")
    .update({ progress: Math.min(100, Math.max(0, progress)), status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, goal: data })
})

/** POST /api/goals/:id/milestones/:mid/complete — check off a milestone */
goalsRouter.post("/:id/milestones/:mid/complete", async (c) => {
  const accessToken = c.get("accessToken") as string
  const userId = c.get("userId") as string
  const supabase = getUserSupabase(accessToken)
  const { id, mid } = c.req.param()

  await supabase
    .from("goal_milestones")
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq("id", mid)
    .eq("goal_id", id)

  // Recalculate goal progress
  const { data: milestones } = await supabase
    .from("goal_milestones")
    .select("is_completed")
    .eq("goal_id", id)

  if (milestones) {
    const total = milestones.length
    const done = milestones.filter((m) => m.is_completed).length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0
    const status = progress >= 100 ? "completed" : "active"
    await supabase.from("goals").update({ progress, status }).eq("id", id).eq("user_id", userId)
  }

  return c.json({ success: true })
})

/** POST /api/goals/ai-suggest — AI suggests milestones for a goal */
goalsRouter.post("/ai-suggest", async (c) => {
  const { title, description, category, targetDate, language } = await c.req.json() as {
    title: string; description?: string; category: string; targetDate?: string; language?: string
  }

  const isAr = (language ?? "ar") === "ar"
  const prompt = isAr
    ? `أنت مدرب نجاح خبير. المستخدم لديه هدف:
العنوان: ${title}
الوصف: ${description ?? ""}
الفئة: ${category}
التاريخ المستهدف: ${targetDate ?? "غير محدد"}

اقترح ٥-٨ خطوات عملية (milestones) لتحقيق هذا الهدف. أرجع JSON فقط:
{"milestones": [{"title": "خطوة 1", "description": "..."}]}`
    : `You are an expert success coach. User's goal:
Title: ${title}
Description: ${description ?? ""}
Category: ${category}
Target date: ${targetDate ?? "not specified"}

Suggest 5-8 practical milestones to achieve this goal. Return JSON only:
{"milestones": [{"title": "Step 1", "description": "..."}]}`

  const { text } = await generateText({ model: getAiModel(), prompt })
  try {
    const match = text.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : { milestones: [] }
    return c.json(parsed)
  } catch {
    return c.json({ milestones: [] })
  }
})

/** DELETE /api/goals/:id */
goalsRouter.delete("/:id", async (c) => {
  const accessToken = c.get("accessToken") as string
  const userId = c.get("userId") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()

  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", userId)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})
