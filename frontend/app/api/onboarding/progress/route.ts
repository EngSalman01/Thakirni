import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** GET: fetch this user's onboarding progress */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("onboarding_progress")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return NextResponse.json({ progress: data ?? null })
}

/** POST: mark a single onboarding milestone */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { step, useCases } = await req.json() as {
    step?: string
    useCases?: string[]
  }

  if (useCases) {
    // Upsert use-case selection
    await supabase
      .from("onboarding_progress")
      .upsert({ user_id: user.id, selected_use_cases: useCases }, { onConflict: "user_id" })
  }

  if (step) {
    const validSteps = ["created_first_task", "used_ai_once", "completed_action", "connected_whatsapp", "saw_first_value"]
    if (!validSteps.includes(step)) {
      return NextResponse.json({ error: "Invalid step" }, { status: 400 })
    }
    await supabase.rpc("mark_onboarding_step", { p_user_id: user.id, p_step: step })
  }

  return NextResponse.json({ ok: true })
}
