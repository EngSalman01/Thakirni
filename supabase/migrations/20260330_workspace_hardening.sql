-- =============================================================================
-- Workspace Hardening Migration
-- Full workspace-level isolation for usage, billing, and RLS.
-- =============================================================================

-- ── 0. Verify backfill completeness, then fill any remaining NULLs ───────────

-- usage: fill any residual NULLs
UPDATE public.usage u
SET workspace_id = (
  SELECT w.id FROM public.workspaces w
  WHERE w.type = 'personal' AND w.owner_id = u.user_id
  LIMIT 1
)
WHERE u.workspace_id IS NULL;

-- usage_daily: fill any residual NULLs
UPDATE public.usage_daily ud
SET workspace_id = (
  SELECT w.id FROM public.workspaces w
  WHERE w.type = 'personal' AND w.owner_id = ud.user_id
  LIMIT 1
)
WHERE ud.workspace_id IS NULL;

-- credits: fill any residual NULLs
UPDATE public.credits c
SET workspace_id = (
  SELECT w.id FROM public.workspaces w
  WHERE w.type = 'personal' AND w.owner_id = c.user_id
  LIMIT 1
)
WHERE c.workspace_id IS NULL;

-- analytics_events: fill any residual NULLs
UPDATE public.analytics_events ae
SET workspace_id = (
  SELECT w.id FROM public.workspaces w
  WHERE w.type = 'personal' AND w.owner_id = ae.user_id
  LIMIT 1
)
WHERE ae.workspace_id IS NULL AND ae.user_id IS NOT NULL;


-- ── 1. Add workspace_id to request_logs ──────────────────────────────────────

ALTER TABLE public.request_logs
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

UPDATE public.request_logs rl
SET workspace_id = (
  SELECT w.id FROM public.workspaces w
  WHERE w.type = 'personal' AND w.owner_id = rl.user_id
  LIMIT 1
)
WHERE rl.workspace_id IS NULL AND rl.user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_request_logs_workspace_id ON public.request_logs(workspace_id);


-- ── 2. Enforce NOT NULL on workspace_id (safe after backfill above) ───────────

ALTER TABLE public.usage       ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.usage_daily ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE public.credits     ALTER COLUMN workspace_id SET NOT NULL;


-- ── 3. Migrate unique constraints: user+month → workspace+month ───────────────

-- usage table
ALTER TABLE public.usage DROP CONSTRAINT IF EXISTS usage_user_id_month_key;
ALTER TABLE public.usage
  ADD CONSTRAINT usage_workspace_id_month_key UNIQUE (workspace_id, month);

-- usage_daily table
ALTER TABLE public.usage_daily DROP CONSTRAINT IF EXISTS usage_daily_user_id_date_key;
ALTER TABLE public.usage_daily
  ADD CONSTRAINT usage_daily_workspace_id_date_key UNIQUE (workspace_id, date);


-- ── 4. Create workspace_billing table ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspace_billing (
  workspace_id            uuid        PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subscription_tier       text        NOT NULL DEFAULT 'FREE'
                                      CHECK (subscription_tier IN ('FREE', 'INDIVIDUAL', 'COMPANY')),
  subscription_status     text        NOT NULL DEFAULT 'inactive'
                                      CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due', 'paused')),
  paddle_subscription_id  text        UNIQUE,
  paddle_customer_id      text,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean     NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_billing ENABLE ROW LEVEL SECURITY;

-- Workspace owners and admins can read billing
CREATE POLICY "workspace_billing_select" ON public.workspace_billing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspace_billing.workspace_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_workspace_billing_paddle_sub ON public.workspace_billing(paddle_subscription_id);
CREATE INDEX IF NOT EXISTS idx_workspace_billing_paddle_cus ON public.workspace_billing(paddle_customer_id);


-- ── 5. Backfill workspace_billing from existing subscriptions ─────────────────

-- Normalize legacy plan tier values before inserting
INSERT INTO public.workspace_billing
  (workspace_id, subscription_tier, subscription_status,
   paddle_subscription_id, paddle_customer_id, current_period_end)
SELECT
  w.id,
  -- Normalize: TEAMS→COMPANY, PRO→INDIVIDUAL, keep FREE/INDIVIDUAL/COMPANY
  CASE COALESCE(p.plan_tier, 'FREE')
    WHEN 'TEAMS' THEN 'COMPANY'
    WHEN 'PRO'   THEN 'INDIVIDUAL'
    ELSE COALESCE(p.plan_tier, 'FREE')
  END,
  CASE
    WHEN s.status = 'active'    THEN 'active'
    WHEN s.status = 'cancelled' THEN 'cancelled'
    ELSE 'inactive'
  END,
  s.paddle_subscription_id,
  COALESCE(s.paddle_customer_id, p.paddle_customer_id),
  s.current_period_end
FROM public.workspaces w
JOIN public.profiles p ON p.id = w.owner_id
LEFT JOIN public.subscriptions s
  ON s.user_id = w.owner_id
  AND s.status = 'active'
ON CONFLICT (workspace_id) DO NOTHING;


-- ── 6. Workspace-based RLS: usage ─────────────────────────────────────────────

DROP POLICY IF EXISTS "users_read_own_usage"        ON public.usage;
DROP POLICY IF EXISTS "workspace_usage_select"      ON public.usage;

CREATE POLICY "workspace_usage_select" ON public.usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = usage.workspace_id AND user_id = auth.uid()
    )
  );


-- ── 7. Workspace-based RLS: usage_daily ──────────────────────────────────────

DROP POLICY IF EXISTS "users_read_own_usage_daily"        ON public.usage_daily;
DROP POLICY IF EXISTS "workspace_usage_daily_select"      ON public.usage_daily;

CREATE POLICY "workspace_usage_daily_select" ON public.usage_daily
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = usage_daily.workspace_id AND user_id = auth.uid()
    )
  );


-- ── 8. Workspace-based RLS: credits ──────────────────────────────────────────

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_credits"    ON public.credits;
DROP POLICY IF EXISTS "workspace_credits_select"  ON public.credits;

CREATE POLICY "workspace_credits_select" ON public.credits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = credits.workspace_id AND user_id = auth.uid()
    )
  );


-- ── 9. Workspace-based RLS: analytics_events ─────────────────────────────────

DROP POLICY IF EXISTS "workspace_analytics_select" ON public.analytics_events;

CREATE POLICY "workspace_analytics_select" ON public.analytics_events
  FOR SELECT USING (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = analytics_events.workspace_id AND user_id = auth.uid()
    )
  );


-- ── 10. Workspace-based RLS: request_logs ────────────────────────────────────

ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_request_logs_select" ON public.request_logs;

CREATE POLICY "workspace_request_logs_select" ON public.request_logs
  FOR SELECT USING (
    workspace_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = request_logs.workspace_id AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );


-- ── 11. Update get_or_create_usage RPC → workspace-scoped ────────────────────

DROP FUNCTION IF EXISTS public.get_or_create_usage(uuid, text);

CREATE OR REPLACE FUNCTION public.get_or_create_usage(
  p_workspace_id  uuid,
  p_month         text,
  p_user_id       uuid DEFAULT NULL   -- kept for attribution only
)
RETURNS public.usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.usage;
BEGIN
  INSERT INTO public.usage(workspace_id, user_id, month)
  VALUES (p_workspace_id, p_user_id, p_month)
  ON CONFLICT (workspace_id, month) DO NOTHING;

  SELECT * INTO result
  FROM public.usage
  WHERE workspace_id = p_workspace_id AND month = p_month;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_usage TO service_role;


-- ── 12. Update increment_usage RPC → workspace-scoped ────────────────────────

DROP FUNCTION IF EXISTS public.increment_usage(uuid, text, text, integer);

CREATE OR REPLACE FUNCTION public.increment_usage(
  p_workspace_id  uuid,
  p_month         text,
  p_field         text,
  p_amount        integer DEFAULT 1,
  p_user_id       uuid DEFAULT NULL   -- kept for attribution only
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage(workspace_id, user_id, month)
  VALUES (p_workspace_id, p_user_id, p_month)
  ON CONFLICT (workspace_id, month) DO NOTHING;

  EXECUTE format(
    'UPDATE public.usage
     SET %I = COALESCE(%I, 0) + $1, updated_at = now()
     WHERE workspace_id = $2 AND month = $3',
    p_field, p_field
  ) USING p_amount, p_workspace_id, p_month;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_usage TO service_role;


-- ── 13. Update increment_usage_daily RPC → workspace-scoped ──────────────────

DROP FUNCTION IF EXISTS public.increment_usage_daily(uuid, text, text, integer);

CREATE OR REPLACE FUNCTION public.increment_usage_daily(
  p_workspace_id  uuid,
  p_date          text,
  p_field         text,
  p_amount        integer DEFAULT 1,
  p_user_id       uuid DEFAULT NULL   -- kept for attribution only
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_daily(workspace_id, user_id, date)
  VALUES (p_workspace_id, p_user_id, p_date)
  ON CONFLICT (workspace_id, date) DO NOTHING;

  EXECUTE format(
    'UPDATE public.usage_daily
     SET %I = COALESCE(%I, 0) + $1
     WHERE workspace_id = $2 AND date = $3',
    p_field, p_field
  ) USING p_amount, p_workspace_id, p_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_usage_daily TO service_role;


-- ── 14. Update consume_credits → workspace-aware ─────────────────────────────

DROP FUNCTION IF EXISTS public.consume_credits(uuid, integer);

CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id       uuid,
  p_amount        integer,
  p_workspace_id  uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
  target_workspace_id uuid;
BEGIN
  -- Resolve workspace: use provided or fall back to user's personal workspace
  IF p_workspace_id IS NOT NULL THEN
    target_workspace_id := p_workspace_id;
    SELECT balance INTO current_balance
    FROM public.credits
    WHERE workspace_id = target_workspace_id
    FOR UPDATE;
  ELSE
    SELECT balance INTO current_balance
    FROM public.credits
    WHERE user_id = p_user_id
    FOR UPDATE
    LIMIT 1;

    SELECT workspace_id INTO target_workspace_id
    FROM public.credits
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.credits
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE workspace_id = target_workspace_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_credits TO service_role;


-- ── 15. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_usage_workspace_month    ON public.usage(workspace_id, month);
CREATE INDEX IF NOT EXISTS idx_usage_daily_workspace_dt ON public.usage_daily(workspace_id, date);
CREATE INDEX IF NOT EXISTS idx_credits_workspace_id2    ON public.credits(workspace_id);
