import { createRouter } from "../lib/types.js"
import { Hono } from "hono"
import { requireAuth, checkPlanLimits } from "../middleware/auth.js"
import { getUserSupabase, getServiceSupabase } from "../lib/supabase.js"
import { getAiModel } from "../services/ai.service.js"
import { generateText } from "ai"

export const documentsRouter = createRouter()
documentsRouter.use("*", requireAuth)

/**
 * POST /api/documents/summarize
 * Upload a text document or PDF (as text) and get an AI summary.
 */
documentsRouter.post("/summarize", checkPlanLimits("document_ai"), async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)

  const formData = await c.req.formData()
  const file = formData.get("file") as File | null
  const textContent = formData.get("text") as string | null
  const title = (formData.get("title") as string) ?? "Document"
  const language = ((formData.get("language") as string) ?? "ar") as "ar" | "en"

  let content = ""

  if (file) {
    // Read as text (supports .txt, .md, etc.)
    content = await file.text()
    if (!content.trim()) {
      return c.json({ error: "Could not extract text from file. Please paste text directly." }, 400)
    }
  } else if (textContent) {
    content = textContent
  } else {
    return c.json({ error: "Provide either a file or text content" }, 400)
  }

  // Truncate to ~15000 tokens worth (~60000 chars)
  const truncated = content.length > 60000 ? content.slice(0, 60000) + "\n...[truncated]" : content
  const wordCount = content.split(/\s+/).length

  const prompt = language === "ar"
    ? `أنت خبير في تحليل الوثائق. قرأت الوثيقة التالية:\n\n${truncated}\n\n
أنشئ ملخصاً شاملاً بالعربية (اللهجة السعودية). أرجع JSON فقط:
{
  "summary": "ملخص ٢-٤ فقرات",
  "keyPoints": ["نقطة ١", "نقطة ٢", ...],
  "mainTopics": ["موضوع ١", ...],
  "sentiment": "إيجابي|سلبي|محايد",
  "readingTime": ${Math.ceil(wordCount / 200)}
}`
    : `You are an expert document analyst. Analyze this document:\n\n${truncated}\n\n
Generate a comprehensive summary. Return ONLY JSON:
{
  "summary": "2-4 paragraph summary",
  "keyPoints": ["Key point 1", ...],
  "mainTopics": ["Topic 1", ...],
  "sentiment": "positive|negative|neutral",
  "readingTime": ${Math.ceil(wordCount / 200)}
}`

  try {
    const { text } = await generateText({ model: getAiModel(), prompt })
    const match = text.match(/\{[\s\S]*\}/)
    const result = match ? JSON.parse(match[0]) : { summary: text, keyPoints: [], mainTopics: [], sentiment: "neutral", readingTime: Math.ceil(wordCount / 200) }

    // Save to database
    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
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

    if (error) {
      console.error("[Documents] DB save error:", error)
      // Return result even if save fails
      return c.json({ success: true, saved: false, ...result })
    }

    return c.json({ success: true, saved: true, document: doc, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Processing failed"
    return c.json({ error: msg }, 500)
  }
})

/** GET /api/documents — list documents */
documentsRouter.get("/", async (c) => {
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const limit = parseInt(c.req.query("limit") ?? "20")

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, word_count, language, summary, main_topics, reading_time_minutes, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ documents: data ?? [] })
})

/** GET /api/documents/:id */
documentsRouter.get("/:id", async (c) => {
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()

  const { data, error } = await supabase.from("documents").select("*").eq("id", id).single()
  if (error || !data) return c.json({ error: "Document not found" }, 404)
  return c.json({ document: data })
})

/** DELETE /api/documents/:id */
documentsRouter.delete("/:id", async (c) => {
  const userId = c.get("userId") as string
  const accessToken = c.get("accessToken") as string
  const supabase = getUserSupabase(accessToken)
  const { id } = c.req.param()

  const { error } = await supabase.from("documents").delete().eq("id", id).eq("user_id", userId)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})
