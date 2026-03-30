-- =============================================================================
-- Workspace Finalization Migration
-- Enforce NOT NULL on analytics_events and request_logs (0 NULLs verified).
-- =============================================================================

-- analytics_events.workspace_id: verified 0 NULLs
ALTER TABLE public.analytics_events
  ALTER COLUMN workspace_id SET NOT NULL;

-- request_logs.workspace_id: verified 0 NULLs
ALTER TABLE public.request_logs
  ALTER COLUMN workspace_id SET NOT NULL;
