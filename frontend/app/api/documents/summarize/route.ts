import { NextRequest } from "next/server"
import { requireAuth, checkPlanFeature } from "@/lib/api-auth"
import { getAiModel } from "@/lib/services/ai.service"
import { generateText } from "ai"

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { allowed } = await checkPlanFeature(auth.userId, "document_ai")
  if (!allowed) {
    return Response.json({ error: "upgrade_required", message: "هذه الميزة تحتاج اشتراك Pro أو أعلى", feature: "document_ai" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const textContent = formData.get("text") as string | null
  const title = (formData.get("title") as string) ?? "Document"
  const language = ((formData.get("language") as string) ?? "ar") as "ar" | "en"

  let content = ""
  if (file) {
    content = await file.text()
    if (!content.trim()) return Response.json({ error: "Could not extract text from file. Please paste text directly." }, { status: 400 })
  } else if (textContent) {
    content = textContent
  } else {
    return Response.json({ error: "Provide either a file or text content" }, { status: 400 })
  }

  const truncated = content.length > 60000 ? content.slice(0, 60000) + "\n...[truncated]" : content
  const wordCount = content.split(/\s+/).length

  const prompt = language === "ar"
    ? `أنت خبير في تحليل الوثائق. قرأت الوثيقة التالية:\n\n${truncated}\n\nأنشئ ملخصاً شاملاً بالعربية (اللهجة السعودية). أرجع JSON فقط:\n{\n  "summary": "ملخص ٢-٤ فقرات",\n  "keyPoints": ["نقطة ١", "نقطة ٢", ...],\n  "mainTopics": ["موضوع ١", ...],\n  "sentiment": "إيجابي|سلبي|محايد",\n  "readingTime": ${Math.ceil(wordCount / 200)}\n}`
    : `You are an expert document analyst. Analyze this document:\n\n${truncated}\n\nGenerate a comprehensive summary. Return ONLY JSON:\n{\n  "summary": "2-4 paragraph summary",\n  "keyPoints": ["Key point 1", ...],\n  "mainTopics": ["Topic 1", ...],\n  "sentiment": "positive|negative|neutral",\n  "readingTime": ${Math.ceil(wordCount / 200)}\n}`

  try {
    const { text } = await generateText({ model: getAiModel(), prompt })
    const match = text.match(/\{[\s\S]*\}/)
    const result = match ? JSON.parse(match[0]) : { summary: text, keyPoints: [], mainTopics: [], sentiment: "neutral", readingTime: Math.ceil(wordCount / 200) }

    const { data: doc, error } = await auth.supabase
      .from("documents")
      .insert({
        user_id: auth.userId,
        title,
        content: truncated,
        word_count: wordCount,
        language,
        summary: result.summary,
        key_points: result.keyPoints ?? [],
        main_topics: result.mainTopics ?? [],
        sentiment: result.sentiment ?? "neutral",
        reading_time_minutes: result.readingTime ?? Math.ceil(wordCount / 200),
      })
      .select()
      .single()

    if (error) return Response.json({ success: true, saved: false, ...result })
    return Response.json({ success: true, saved: true, document: doc, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Processing failed"
    return Response.json({ error: msg }, { status: 500 })
  }
}
