import { createClient } from "@supabase/supabase-js"

function getServiceSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export type AuditEvent =
  | "login" | "logout" | "password_change" | "email_change"
  | "data_export" | "account_deletion" | "consent_given"
  | "billing_action" | "admin_action" | "security_incident"

export async function logAuditEvent(
  userId: string,
  event: AuditEvent,
  description?: string,
  metadata?: Record<string, unknown>,
  workspaceId?: string
): Promise<void> {
  try {
    const service = getServiceSupabase()
    const meta = workspaceId
      ? { ...( metadata ?? {}), workspace_id: workspaceId }
      : (metadata ?? {})
    await service.rpc("create_audit_log", {
      p_user_id: userId,
      p_event_type: event,
      p_description: description ?? null,
      p_metadata: meta,
    })
  } catch {
    // fire-and-forget, never throws
  }
}
