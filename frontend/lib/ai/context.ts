/**
 * Conversation context builder.
 * Pulls the last N messages from `conversations` plus memory summary
 * and returns a structured context object ready to inject into prompts.
 *
 * Rules:
 * - NEVER expose this to the browser — server-side only
 * - Keep total context lean (last 8 messages max)
 * - Silently infer intent; never correct typos in context
 */
import { createClient } from "@supabase/supabase-js"
import { getRelevantMemory } from "./memory"

export interface ContextMessage {
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface UserContext {
  recentMessages: ContextMessage[]
  memoryBlock: string
  lastActiveAt: string | null
}

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Build full user context:
 *   - Last `limit` messages from conversations table
 *   - Memory block (formatted key facts)
 */
export async function buildContext(
  userId: string,
  workspaceId: string | null,
  limit = 8
): Promise<UserContext> {
  const service = getService()

  const [messagesResult, memoryResult] = await Promise.all([
    service
      .from("conversations")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: false })
      .limit(limit),
    getRelevantMemory(userId, workspaceId),
  ])

  const messages = ((messagesResult.data ?? []) as ContextMessage[])
    .reverse() // chronological order

  const lastUserMsg = messages.filter(m => m.role === "user").at(-1)

  return {
    recentMessages: messages,
    memoryBlock: memoryResult.formatted,
    lastActiveAt: lastUserMsg?.created_at ?? null,
  }
}

/**
 * Format context as a system prompt block for injection.
 * Returns empty string if nothing useful in context.
 */
export function formatContextBlock(ctx: UserContext): string {
  const parts: string[] = []

  if (ctx.memoryBlock) {
    parts.push(`[معلومات عن المستخدم: ${ctx.memoryBlock}]`)
  }

  if (ctx.recentMessages.length > 0) {
    const history = ctx.recentMessages
      .slice(-5)
      .map(m => `${m.role === "user" ? "المستخدم" : "المساعد"}: ${m.content}`)
      .join("\n")
    parts.push(`[سياق المحادثة الأخيرة:\n${history}]`)
  }

  return parts.join("\n\n")
}
