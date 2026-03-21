import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { getAiModel } from "@/lib/services/ai.service"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { title, description, category, targetDate, language } = await req.json() as {
    title: string; description?: string; category: string; targetDate?: string; language?: string
  }

  const isAr = (language ?? "ar") === "ar"
  const prompt = isAr
    ? `أنت مدرب نجاح خبير. المستخدم لديه هدف:\nالعنوان: ${title}\nالوصف: ${description ?? ""}\nالفئة: ${category}\nالتاريخ المستهدف: ${targetDate ?? "غير محدد"}\n\nاقترح ٥-٨ خطوات عملية (milestones) لتحقيق هذا الهدف. أرجع JSON فقط:\n{"milestones": [{"title": "خطوة 1", "description": "..."}]}`
    : `You are an expert success coach. User's goal:\nTitle: ${title}\nDescription: ${description ?? ""}\nCategory: ${category}\nTarget date: ${targetDate ?? "not specified"}\n\nSuggest 5-8 practical milestones to achieve this goal. Return JSON only:\n{"milestones": [{"title": "Step 1", "description": "..."}]}`

  const { text } = await generateText({ model: getAiModel(), prompt })
  try {
    const match = text.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : { milestones: [] }
    return Response.json(parsed)
  } catch {
    return Response.json({ milestones: [] })
  }
}
