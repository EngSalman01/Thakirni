// ── Direct Gemini REST helper (replaces @ai-sdk/google to avoid convertToBase64 bug) ──

const RETRYABLE = new Set([429, 503])

/** Call Gemini text-only generateContent with retry on 503/429. */
export async function geminiText(
  prompt: string,
  options?: { system?: string; maxOutputTokens?: number; temperature?: number; model?: string }
): Promise<string> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set")

  const model = options?.model ?? "gemini-2.5-flash-lite"
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: options?.maxOutputTokens ?? 2000,
      ...(options?.temperature !== undefined ? { temperature: options.temperature } : {}),
    },
  }
  if (options?.system) {
    body.system_instruction = { parts: [{ text: options.system }] }
  }

  let lastErr: Error = new Error("Gemini request failed")
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, Math.min(4000 * 2 ** (attempt - 1), 30000)))
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    )
    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      lastErr = new Error(`Gemini failed (${res.status}): ${errText}`)
      if (RETRYABLE.has(res.status)) continue
      throw lastErr
    }
    interface GeminiRes { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const data = await res.json() as GeminiRes
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error("Gemini returned empty response")
    return text
  }
  throw lastErr
}

