-- =============================================================================
-- Workspace Enforcement Migration
-- Adds workspace_id to audit_logs, hardens RLS on workspace-aware tables,
-- and indexes for workspace-scoped queries.
-- =============================================================================

-- ── 1. Add workspace_id to audit_logs ────────────────────────────────────────

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON public.audit_logs(workspace_id);

-- Drop old signature (parameter count changed) then recreate
DROP FUNCTION IF EXISTS public.create_audit_log(uuid, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id      uuid,
  p_event_type   text,
  p_description  text    DEFAULT NULL,
  p_metadata     jsonb   DEFAULT '{}',
  p_workspace_id uuid    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs(user_id, event_type, description, metadata, workspace_id)
  VALUES (p_user_id, p_event_type, p_description, p_metadata, p_workspace_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_audit_log TO service_role;


-- ── 2. Harden RLS: projects — add workspace_id-based access policy ────────────
-- Projects already have team_id-based policies; add workspace_id policy alongside.

DROP POLICY IF EXISTS "workspace_projects_select" ON public.projects;
CREATE POLICY "workspace_projects_select" ON public.projects
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_projects_insert" ON public.projects;
CREATE POLICY "workspace_projects_insert" ON public.projects
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

DROP POLICY IF EXISTS "workspace_projects_update" ON public.projects;
CREATE POLICY "workspace_projects_update" ON public.projects
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_projects_delete" ON public.projects;
CREATE POLICY "workspace_projects_delete" ON public.projects
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );


-- ── 3. Harden RLS: jobs — workspace members (admin/owner) can view jobs ────────
-- jobs has no user_id column; access is scoped by workspace_id only.

DROP POLICY IF EXISTS "workspace_jobs_select" ON public.jobs;
CREATE POLICY "workspace_jobs_select" ON public.jobs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );


-- ── 4. Backfill: set workspace_id on usage records that still lack it ─────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT u.user_id
    FROM public.usage u
    WHERE u.workspace_id IS NULL
  LOOP
    UPDATE public.usage
    SET workspace_id = (
      SELECT w.id FROM public.workspaces w
      WHERE w.type = 'personal' AND w.owner_id = r.user_id
      LIMIT 1
    )
    WHERE usage.user_id = r.user_id AND usage.workspace_id IS NULL;
  END LOOP;
END;
$$;


-- ── 5. Backfill: set workspace_id on credits records that still lack it ────────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT c.user_id
    FROM public.credits c
    WHERE c.workspace_id IS NULL
  LOOP
    UPDATE public.credits
    SET workspace_id = (
      SELECT w.id FROM public.workspaces w
      WHERE w.type = 'personal' AND w.owner_id = r.user_id
      LIMIT 1
    )
    WHERE credits.user_id = r.user_id AND credits.workspace_id IS NULL;
  END LOOP;
END;
$$;


-- ── 6. Backfill: set workspace_id on analytics_events that still lack it ──────

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT ae.user_id
    FROM public.analytics_events ae
    WHERE ae.workspace_id IS NULL AND ae.user_id IS NOT NULL
  LOOP
    UPDATE public.analytics_events
    SET workspace_id = (
      SELECT w.id FROM public.workspaces w
      WHERE w.type = 'personal' AND w.owner_id = r.user_id
      LIMIT 1
    )
    WHERE analytics_events.user_id = r.user_id AND analytics_events.workspace_id IS NULL;
  END LOOP;
END;
$$;


-- ── 7. Add workspace_id to usage_daily if missing ────────────────────────────

ALTER TABLE public.usage_daily
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usage_daily_workspace_id ON public.usage_daily(workspace_id);


-- ── 8. Indexes for workspace-scoped queries ───────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_usage_workspace_id          ON public.usage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_credits_workspace_id        ON public.credits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_analytics_workspace_id      ON public.analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_jobs_workspace_id           ON public.jobs(workspace_id);
