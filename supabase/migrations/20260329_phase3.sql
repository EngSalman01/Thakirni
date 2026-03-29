-- ─── System Usage (global budget tracking) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_usage (
  month            text PRIMARY KEY,  -- e.g. "2026-03"
  total_tokens     bigint NOT NULL DEFAULT 0,
  total_requests   bigint NOT NULL DEFAULT 0,
  updated_at       timestamptz DEFAULT now()
);

-- ─── System Limits (global budget caps) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_limits (
  key         text PRIMARY KEY,
  value       bigint NOT NULL,
  description text
);

INSERT INTO public.system_limits (key, value, description) VALUES
  ('max_requests_per_month', 50000,  'Global monthly request cap across all users'),
  ('max_tokens_per_month',   10000000, 'Global monthly token cap across all users'),
  ('alert_threshold_pct',    80,     'Send alert when usage reaches this % of limit')
ON CONFLICT (key) DO NOTHING;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.system_usage  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_limits ENABLE ROW LEVEL SECURITY;
-- service_role only — no user-facing reads needed

-- ─── increment_system_usage RPC ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_system_usage(
  p_month    text,
  p_tokens   bigint DEFAULT 0,
  p_requests bigint DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.system_usage (month, total_tokens, total_requests, updated_at)
  VALUES (p_month, p_tokens, p_requests, now())
  ON CONFLICT (month) DO UPDATE
    SET total_tokens   = system_usage.total_tokens   + p_tokens,
        total_requests = system_usage.total_requests + p_requests,
        updated_at     = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_system_usage TO service_role;
