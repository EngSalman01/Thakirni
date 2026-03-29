import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

const _google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })

export function getGoogle() {
  return _google
}

export function getAiModel() {
  return _google("gemini-2.0-flash")
}

export function getFastModel() {
  return _google("gemini-2.0-flash")
}

export function getHijriDate(timezone = "Asia/Riyadh"): string {
  const now = new Date()
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      timeZone: timezone,
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(now)
  } catch {
    return ""
  }
}

export function formatTodayBlock(plans: Record<string, unknown>[], _date: string): string {
  if (!plans.length) return "📭 TODAY'S SCHEDULE\nNo plans for today."
  const icons: Record<string, string> = {
    meeting: "📅", task: "✅", grocery: "🛒", work: "💼",
    personal: "🏠", health: "🏃", finance: "💰", other: "📌",
  }
  const lines = plans.map((p) => {
    const time = typeof p.plan_time === "string" ? p.plan_time.slice(0, 5) : "--:--"
    const icon = icons[(p.category as string) ?? "other"] ?? "📌"
    return `  ${icon} ${time}  ${p.title}${p.location ? ` @ ${p.location}` : ""}`
  })
  return `📋 TODAY'S SCHEDULE (${plans.length} item${plans.length !== 1 ? "s" : ""})\n${lines.join("\n")}`
}

export function formatFactsBlock(facts: Array<{ fact: string; category: string }>): string {
  if (!facts.length) return ""
  const grouped: Record<string, string[]> = {}
  for (const f of facts) {
    if (!grouped[f.category]) grouped[f.category] = []
    grouped[f.category].push(f.fact)
  }
  const icons: Record<string, string> = {
    work: "💼", family: "👨‍👩‍👧", health: "❤️", finance: "💰",
    preference: "⭐", location: "📍", education: "🎓", contact: "📱", general: "📝",
  }
  const sections = Object.entries(grouped).map(([cat, items]) => {
    const icon = icons[cat] ?? "📝"
    return `${icon} ${cat.toUpperCase()}\n${items.map((i) => `  • ${i}`).join("\n")}`
  })
  return `🧠 WHAT I KNOW ABOUT YOU\n${sections.join("\n")}`
}

/**
 * Summarise text using the fast model.
 */
export async function summarizeText(text: string, language: "ar" | "en" = "ar"): Promise<string> {
  const { text: summary } = await generateText({
    model: getFastModel(),
    prompt: language === "ar"
      ? `لخّص النص التالي بنقاط واضحة باللغة العربية (اللهجة السعودية إذا أمكن):\n\n${text}`
      : `Summarize the following text in clear bullet points:\n\n${text}`,
  })
  return summary
}

/**
 * Generate a warm daily briefing message.
 */
export async function generateDailyBriefing(input: {
  name: string
  plans: Record<string, unknown>[]
  language: "ar" | "en"
  hijriDate: string
  gregorianDate: string
  timeOfDay: string
}): Promise<string> {
  const planText = input.plans.length
    ? input.plans.map((p) => `- ${p.title} at ${p.plan_time ?? "all day"}`).join("\n")
    : "No plans for today."

  const prompt = input.language === "ar"
    ? `أنت ذكرني، مساعد شخصي ذكي بلهجة سعودية عامية. اكتب تحية صباحية دافئة وودية لـ${input.name ?? "المستخدم"} عن اليوم ${input.gregorianDate} (${input.hijriDate}). الخطط اليوم:\n${planText}\n\nاكتب بلغة بسيطة طبيعية بالعامية السعودية. لا أكثر من ٣ جمل.`
    : `You are Thakirni, a smart personal assistant. Write a warm friendly greeting for ${input.name ?? "the user"} for today ${input.gregorianDate}. Today's plans:\n${planText}\n\nKeep it to 2-3 sentences, warm and natural.`

  const { text } = await generateText({ model: getFastModel(), prompt })
  return text
}

/**
 * Extract personal facts from user messages using the LLM.
 */
export async function extractFacts(userMessage: string): Promise<Array<{ fact: string; category: string }>> {
  const { text } = await generateText({
    model: getFastModel(),
    prompt: `Extract personal facts from this message. Return JSON array only, no explanation.
Each item: {"fact": "...", "category": "work|family|health|finance|preference|location|education|contact|general"}
Only extract clear factual statements. Return [] if none.
Message: "${userMessage}"`,
  })

  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0])
  } catch {
    return []
  }
}
