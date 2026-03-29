import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getAiModel } from "@/lib/services/ai.service"
import { generateText } from "ai"
import { limiters, rateLimitResponse } from "@/lib/rate-limit"
import { enforceUsage } from "@/lib/usage/enforce"
import { incrementUsage } from "@/lib/usage/increment"

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Rate limit
  const rl = await limiters.chat(auth.userId)
  if (!rl.success) return rateLimitResponse(rl.reset)

  // Usage enforcement (counts as an AI chat request)
  const enforcement = await enforceUsage(auth.userId, "ai_chat")
  if (!enforcement.allowed) {
    if (enforcement.reason === "kill_switch") return Response.json({ error: "AI features temporarily unavailable" }, { status: 503 })
    return Response.json({ error: "Monthly AI limit reached. Upgrade for more.", code: "limit_exceeded" }, { status: 429 })
  }

  const { title, description, category, targetDate, language } = await req.json() as {
    title: string; description?: string; category: string; targetDate?: string; language?: string
  }

  const isAr = (language ?? "ar") === "ar"
  const prompt = isAr
    ? `أنت مدرب نجاح خبير. المستخدم لديه هدف:\nالعنوان: ${title}\nالوصف: ${description ?? ""}\nالفئة: ${category}\nالتاريخ المستهدف: ${targetDate ?? "غير محدد"}\n\nاقترح ٥-٨ خطوات عملية (milestones) لتحقيق هذا الهدف. أرجع JSON فقط:\n{"milestones": [{"title": "خطوة 1", "description": "..."}]}`
    : `You are an expert success coach. User's goal:\nTitle: ${title}\nDescription: ${description ?? ""}\nCategory: ${category}\nTarget date: ${targetDate ?? "not specified"}\n\nSuggest 5-8 practical milestones to achieve this goal. Return JSON only:\n{"milestones": [{"title": "Step 1", "description": "..."}]}`

  try {
    const { text } = await generateText({ model: getAiModel(), prompt })

    incrementUsage(auth.userId, "ai_chat").catch(() => {})

    const match = text.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : { milestones: [] }
    return Response.json(parsed)
  } catch {
    return Response.json({ milestones: [] })
  }
}
