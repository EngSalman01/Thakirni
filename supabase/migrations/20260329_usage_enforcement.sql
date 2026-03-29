-- ─── Usage tracking (monthly) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month      text    NOT NULL,   -- YYYY-MM
  ai_chat_requests   integer DEFAULT 0,
  document_uploads   integer DEFAULT 0,
  meeting_summaries  integer DEFAULT 0,
  voice_note_minutes integer DEFAULT 0,
  tokens_used        bigint  DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- ─── Usage tracking (daily) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_daily (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       text    NOT NULL,   -- YYYY-MM-DD
  ai_chat_requests integer DEFAULT 0,
  plans_created    integer DEFAULT 0,
  requests_total   integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ─── Feature flags ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key                  text    PRIMARY KEY,
  enabled              boolean DEFAULT true,
  rollout_percentage   integer DEFAULT 100
    CHECK (rollout_percentage BETWEEN 0 AND 100),
  description          text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- ─── Audit logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  action     text    NOT NULL,
  metadata   jsonb   DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- ─── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.usage        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_daily  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_usage"        ON public.usage;
DROP POLICY IF EXISTS "users_read_own_usage_daily"  ON public.usage_daily;
DROP POLICY IF EXISTS "feature_flags_public_read"   ON public.feature_flags;
DROP POLICY IF EXISTS "users_read_own_audit_logs"   ON public.audit_logs;

CREATE POLICY "users_read_own_usage"       ON public.usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_read_own_usage_daily" ON public.usage_daily
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "feature_flags_public_read"  ON public.feature_flags
  FOR SELECT USING (true);

CREATE POLICY "users_read_own_audit_logs"  ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usage_user_month        ON public.usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_usage_daily_user_date   ON public.usage_daily(user_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id      ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at   ON public.audit_logs(created_at DESC);

-- ─── Helper RPCs (service role only) ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_or_create_usage(
  p_user_id uuid,
  p_month   text
)
RETURNS public.usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.usage;
BEGIN
  INSERT INTO public.usage(user_id, month)
  VALUES (p_user_id, p_month)
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT * INTO result
  FROM public.usage
  WHERE user_id = p_user_id AND month = p_month;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id uuid,
  p_month   text,
  p_field   text,
  p_amount  integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure row exists
  INSERT INTO public.usage(user_id, month)
  VALUES (p_user_id, p_month)
  ON CONFLICT (user_id, month) DO NOTHING;

  -- Increment the named field
  EXECUTE format(
    'UPDATE public.usage SET %I = COALESCE(%I, 0) + $1, updated_at = now() WHERE user_id = $2 AND month = $3',
    p_field, p_field
  ) USING p_amount, p_user_id, p_month;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_usage_daily(
  p_user_id uuid,
  p_date    text,
  p_field   text,
  p_amount  integer DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_daily(user_id, date)
  VALUES (p_user_id, p_date)
  ON CONFLICT (user_id, date) DO NOTHING;

  EXECUTE format(
    'UPDATE public.usage_daily SET %I = COALESCE(%I, 0) + $1 WHERE user_id = $2 AND date = $3',
    p_field, p_field
  ) USING p_amount, p_user_id, p_date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_usage       TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_usage           TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_usage_daily     TO service_role;

-- ─── Seed essential feature flags ──────────────────────────────────────────
INSERT INTO public.feature_flags(key, enabled, description) VALUES
  ('ai_chat',            true,  'Enable AI chat for all users'),
  ('whatsapp_ai',        true,  'Enable WhatsApp AI responses'),
  ('document_ai',        true,  'Enable document AI summarization'),
  ('meeting_summary',    true,  'Enable meeting recording & summary'),
  ('voice_notes',        true,  'Enable voice note transcription'),
  ('ai_kill_switch',     false, 'Emergency kill switch — set to true to disable ALL AI')
ON CONFLICT (key) DO NOTHING;
