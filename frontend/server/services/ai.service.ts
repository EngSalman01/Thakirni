/**
 * AI Service — all AI-related business logic.
 * Used by API routes only. Never imported by client components.
 *
 * Uses Gemini REST API directly to avoid @ai-sdk/google convertToBase64 bug
 * in @ai-sdk/provider-utils v2.
 */
import "server-only";

// ── Gemini REST helper ────────────────────────────────────────────────────────

async function geminiText(
  prompt: string,
  options?: { system?: string; maxOutputTokens?: number; temperature?: number }
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? ""
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: options?.maxOutputTokens ?? 400,
      thinkingConfig: { thinkingBudget: 0 },
      ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
    },
  }
  if (options?.system) body.system_instruction = { parts: [{ text: options.system }] }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  )
  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Gemini failed (${res.status}): ${errText}`)
  }
  interface GRes { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const data = await res.json() as GRes
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
}

// ── Hijri Date ────────────────────────────────────────────────────────────────

/**
 * Returns today's Hijri date using the Umm al-Qura calendar.
 * Uses Node.js built-in Intl — no external packages needed.
 */
export function getHijriDate(timezone = "Asia/Riyadh"): string {
  try {
    const now = new Date();
    const hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      day:      "numeric",
      month:    "long",
      year:     "numeric",
      timeZone: timezone,
    }).format(now);
    // Also get year for English format
    const hijriYear = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      year:     "numeric",
      timeZone: timezone,
    }).format(now);
    return `${hijri} (${hijriYear})`;
  } catch {
    return "";
  }
}

// ── Today's Plans Formatter ───────────────────────────────────────────────────

interface PlanRow {
  title:    string;
  plan_time?: string | null;
  end_time?:  string | null;
  category:  string;
  location?: string | null;
  priority:  string;
  status:    string;
}

/**
 * Formats today's plans into a compact, readable block for injection into
 * the AI system prompt so the model can give an instant briefing on greeting
 * without an extra list_plans tool call.
 */
export function formatTodayBlock(plans: PlanRow[], date: string): string {
  if (!plans || plans.length === 0) {
    return `📅 TODAY (${date})\n  No events scheduled — free day!`;
  }

  const icon: Record<string, string> = {
    meeting:  "🤝",
    task:     "✅",
    grocery:  "🛒",
    work:     "💼",
    personal: "🌿",
    health:   "❤️",
    finance:  "💰",
    other:    "📌",
  };

  const lines = plans.map((p) => {
    const time    = p.plan_time ? p.plan_time.slice(0, 5) : "all-day";
    const endTime = p.end_time  ? `→ ${p.end_time.slice(0, 5)}`  : "";
    const loc     = p.location  ? `  📍 ${p.location}`           : "";
    const emoji   = icon[p.category] ?? "📌";
    const badge   = p.priority === "high" ? " 🔴" : p.priority === "medium" ? "" : " ⬇️";
    return `  ${emoji} ${time} ${endTime}  ${p.title}${badge}${loc}`;
  });

  return `📅 TODAY (${date})\n${lines.join("\n")}`;
}

// ── Facts Formatter ───────────────────────────────────────────────────────────

interface FactRow { fact: string; category: string; }

/**
 * Groups facts by category and formats them into a context block.
 */
export function formatFactsBlock(facts: FactRow[]): string {
  if (!facts || facts.length === 0) return "";

  const byCategory: Record<string, string[]> = {};
  for (const { fact, category } of facts) {
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(fact);
  }

  const categoryIcon: Record<string, string> = {
    work:       "💼",
    family:     "👨‍👩‍👧",
    health:     "❤️",
    finance:    "💰",
    preference: "⭐",
    location:   "📍",
    education:  "🎓",
    contact:    "📞",
    general:    "📝",
  };

  const lines = Object.entries(byCategory)
    .map(([cat, catFacts]) => {
      const em = categoryIcon[cat] ?? "📌";
      return `  ${em} [${cat}]\n${catFacts.map((f) => `    • ${f}`).join("\n")}`;
    })
    .join("\n");

  return `━━━━━━━━━━━━━━━━━━━━━━━━
🧠 WHAT I KNOW ABOUT YOU
${lines}
━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ── Summarize Text ────────────────────────────────────────────────────────────

export async function summarizeText(
  text: string,
  language: "ar" | "en" = "ar"
): Promise<string> {
  const prompt =
    language === "ar"
      ? `لخّص النص التالي بإيجاز واحتفظ بالنقاط الرئيسية:\n\n${text}`
      : `Summarize the following text concisely, keeping the key points:\n\n${text}`;
  return geminiText(prompt, { maxOutputTokens: 400 });
}

// ── Generate Daily Briefing ───────────────────────────────────────────────────

interface DailyBriefingInput {
  userName:   string;
  plans:      PlanRow[];
  date:       string;
  timeOfDay:  "morning" | "afternoon" | "evening" | "night";
  language:   "ar" | "en";
}

export async function generateDailyBriefing(input: DailyBriefingInput): Promise<string> {
  const { userName, plans, date, timeOfDay, language } = input;

  const greetingAr: Record<string, string> = {
    morning:   "صباح الخير",
    afternoon: "مساء الخير",
    evening:   "مساء النور",
    night:     "مساء النور",
  };

  const plansSummary =
    plans.length === 0
      ? language === "ar"
        ? "لا يوجد أي مواعيد أو مهام اليوم."
        : "No events or tasks scheduled today."
      : plans
          .map((p) => `- ${p.title}${p.plan_time ? ` at ${p.plan_time.slice(0, 5)}` : ""}`)
          .join("\n");

  const prompt =
    language === "ar"
      ? `أنت مساعد ذكي. اكتب ملخصاً يومياً قصيراً وودياً للمستخدم ${userName}. قل "${greetingAr[timeOfDay]}" ثم اذكر أهم ما في يومه بأسلوب طبيعي. التاريخ: ${date}. المهام:\n${plansSummary}`
      : `You are a friendly AI assistant. Write a short, warm daily briefing for ${userName}. Date: ${date}. Today's schedule:\n${plansSummary}`;

  return geminiText(prompt, { maxOutputTokens: 250, temperature: 0.7 });
}

// ── Extract Personal Facts from Text ─────────────────────────────────────────

export interface ExtractedFact {
  fact:     string;
  category: "work" | "family" | "health" | "finance" | "preference" | "location" | "education" | "contact" | "general";
}

/**
 * Extracts personal facts from a user message using the fast model.
 * Returns an empty array if no facts are found.
 */
export async function extractFacts(userMessage: string): Promise<ExtractedFact[]> {
  const text = await geminiText(userMessage, {
    system: `Extract personal facts from the user message and return them as JSON array.
Each fact: { "fact": "...", "category": "work|family|health|finance|preference|location|education|contact|general" }
Return [] if no personal facts. Only return the JSON array, nothing else.`,
    maxOutputTokens: 300,
    temperature: 0,
  });

  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as ExtractedFact[];
  } catch {
    return [];
  }
}

// ── Classify Message Intent ───────────────────────────────────────────────────

export type MessageIntent =
  | "create_plan"
  | "list_plans"
  | "save_memory"
  | "search"
  | "daily_briefing"
  | "question"
  | "chitchat"
  | "other";

/**
 * Quickly classifies the primary intent of a user message.
 * Used to pre-warm the right tools or skip unnecessary ones.
 */
export async function classifyIntent(message: string): Promise<MessageIntent> {
  const text = await geminiText(message, {
    system: `Classify the user message into one of these intents. Return only the intent string.
Intents: create_plan, list_plans, save_memory, search, daily_briefing, question, chitchat, other`,
    maxOutputTokens: 10,
    temperature: 0,
  });

  const clean = text.trim().toLowerCase().replace(/[^a-z_]/g, "");
  const valid: MessageIntent[] = [
    "create_plan", "list_plans", "save_memory", "search",
    "daily_briefing", "question", "chitchat", "other",
  ];
  return valid.includes(clean as MessageIntent) ? (clean as MessageIntent) : "other";
}
