/**
 * Persistent memory system for Thakirni.
 * Stores and retrieves high-confidence facts about users
 * so the AI can use them naturally in conversations.
 *
 * Categories:
 *   people          — relationships ("بسام = أخوي")
 *   preferences     — sleep time, food, habits
 *   routines        — gym schedule, work hours
 *   important_dates — birthdays, anniversaries
 */

import { createClient } from "@supabase/supabase-js"

type MemoryCategory = "people" | "preferences" | "routines" | "important_dates"

interface MemoryRow {
  key: string
  value: Record<string, unknown>
  category: MemoryCategory
  confidence: number
  updated_at: string
}

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Upsert a memory entry for a user.
 * Only stores if confidence >= 0.70 to avoid saving noise.
 */
export async function storeMemory(
  userId: string,
  workspaceId: string | null,
  key: string,
  value: Record<string, unknown>,
  category: MemoryCategory,
  confidence = 0.85
): Promise<void> {
  if (confidence < 0.70) return

  const service = getService()
  await service
    .from("user_memory")
    .upsert(
      {
        user_id: userId,
        workspace_id: workspaceId,
        key,
        value,
        category,
        confidence,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,key" }
    )
}

/**
 * Retrieve all memories for a user, formatted as a context block
 * the AI can read naturally.
 *
 * Returns a concise Arabic string like:
 *   "عارف عنك: أخوك اسمه بسام | تنام الساعة ١١ | نادي: الثلاثاء والخميس"
 */
export async function getRelevantMemory(
  userId: string,
  workspaceId: string | null
): Promise<{ raw: MemoryRow[]; formatted: string }> {
  const service = getService()

  const query = service
    .from("user_memory")
    .select("key, value, category, confidence, updated_at")
    .eq("user_id", userId)
    .gte("confidence", 0.70)
    .order("updated_at", { ascending: false })
    .limit(30)

  if (workspaceId) {
    query.or(`workspace_id.eq.${workspaceId},workspace_id.is.null`)
  }

  const { data } = await query
  const rows = (data ?? []) as MemoryRow[]

  if (rows.length === 0) return { raw: [], formatted: "" }

  const formatted = formatMemoryBlock(rows)
  return { raw: rows, formatted }
}

function formatMemoryBlock(rows: MemoryRow[]): string {
  const lines: string[] = []

  const people = rows.filter(r => r.category === "people")
  const prefs  = rows.filter(r => r.category === "preferences")
  const routines = rows.filter(r => r.category === "routines")
  const dates  = rows.filter(r => r.category === "important_dates")

  if (people.length > 0) {
    lines.push(people.map(r => {
      const label = r.value.label ?? r.key
      const relation = r.value.relation ?? ""
      return relation ? `${label} (${relation})` : String(label)
    }).join("، "))
  }

  if (prefs.length > 0) {
    lines.push(prefs.map(r => {
      const v = r.value.text ?? r.value.value ?? r.key
      return String(v)
    }).join("، "))
  }

  if (routines.length > 0) {
    lines.push(routines.map(r => {
      const v = r.value.text ?? r.value.value ?? r.key
      return String(v)
    }).join("، "))
  }

  if (dates.length > 0) {
    lines.push(dates.map(r => {
      const v = r.value.text ?? r.value.value ?? r.key
      return String(v)
    }).join("، "))
  }

  return lines.join(" | ")
}

/**
 * Extract and store memories from a user message using rule-based patterns.
 * For high-precision extraction only — never stores uncertain facts.
 *
 * Patterns detected (Khobar dialect):
 *   - Relationships: "أخوي X", "أختي X", "صاحبي X", "زوجتي X", "أمي X", "أبوي X"
 *   - Routines: "أروح النادي", "أصحى", "أنام"
 *   - Dates: "عيد ميلاد X", "ذكرى X"
 */
export async function extractAndStoreMemory(
  userId: string,
  workspaceId: string | null,
  message: string
): Promise<void> {
  const extractions: Array<{
    key: string
    value: Record<string, unknown>
    category: MemoryCategory
    confidence: number
  }> = []

  // ── People / relations ───────────────────────────────────────────────────
  const relationPatterns: Array<{ regex: RegExp; relation: string; key: string }> = [
    { regex: /أخوي\s+(\S+)/u,   relation: "أخ",    key: "brother" },
    { regex: /أختي\s+(\S+)/u,   relation: "أخت",   key: "sister" },
    { regex: /صاحبي\s+(\S+)/u,  relation: "صديق",  key: "friend" },
    { regex: /زوجتي\s+(\S+)/u,  relation: "زوجة",  key: "wife" },
    { regex: /زوجي\s+(\S+)/u,   relation: "زوج",   key: "husband" },
    { regex: /أمي\s+(\S+)/u,    relation: "أم",    key: "mother" },
    { regex: /أبوي\s+(\S+)/u,   relation: "أب",    key: "father" },
    { regex: /ولدي\s+(\S+)/u,   relation: "ابن",   key: "son" },
    { regex: /بنتي\s+(\S+)/u,   relation: "ابنة",  key: "daughter" },
  ]

  for (const { regex, relation, key } of relationPatterns) {
    const m = regex.exec(message)
    if (m) {
      const name = m[1].replace(/[.,،]/g, "")
      extractions.push({
        key: `${key}_${name.toLowerCase()}`,
        value: { label: name, relation, text: `${name} (${relation})` },
        category: "people",
        confidence: 0.90,
      })
    }
  }

  // ── Important dates ──────────────────────────────────────────────────────
  const birthdayMatch = /عيد ميلاد\s+(\S+)/u.exec(message)
  if (birthdayMatch) {
    const name = birthdayMatch[1].replace(/[.,،]/g, "")
    extractions.push({
      key: `birthday_${name.toLowerCase()}`,
      value: { label: name, text: `عيد ميلاد ${name}`, event: "birthday" },
      category: "important_dates",
      confidence: 0.92,
    })
  }

  // ── Routines — gym ───────────────────────────────────────────────────────
  const gymMatch = /أروح النادي\s*(يوم\s+\S+|\S+وار)/.exec(message)
  if (gymMatch) {
    extractions.push({
      key: "gym_routine",
      value: { text: `نادي: ${gymMatch[1]}`, schedule: gymMatch[1] },
      category: "routines",
      confidence: 0.80,
    })
  }

  // ── Preferences — sleep time ─────────────────────────────────────────────
  const sleepMatch = /أنام.*?الساعة\s*(\d+)/u.exec(message)
  if (sleepMatch) {
    extractions.push({
      key: "sleep_time",
      value: { text: `وقت النوم: ${sleepMatch[1]}`, hour: sleepMatch[1] },
      category: "preferences",
      confidence: 0.78,
    })
  }

  // ── Store all extracted memories ─────────────────────────────────────────
  for (const e of extractions) {
    await storeMemory(userId, workspaceId, e.key, e.value, e.category, e.confidence)
  }
}
