-- ─── Background jobs queue ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text        NOT NULL,
  payload     jsonb       DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'done', 'failed')),
  priority    integer     DEFAULT 0,
  attempts    integer     DEFAULT 0,
  max_retries integer     DEFAULT 3,
  error       text,
  run_at      timestamptz DEFAULT now(),
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_run_at ON public.jobs(status, run_at)
  WHERE status = 'pending';

-- ─── Credits ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credits (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance      integer     NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime     integer     NOT NULL DEFAULT 0,
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_credits_user_id ON public.credits(user_id);

-- ─── Request logs (observability) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.request_logs (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint      text        NOT NULL,
  method        text        NOT NULL DEFAULT 'POST',
  status_code   integer,
  duration_ms   integer,
  tokens_used   integer,
  model         text,
  error         text,
  metadata      jsonb       DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_user_id     ON public.request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at  ON public.request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint    ON public.request_logs(endpoint);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_logs  ENABLE ROW LEVEL SECURITY;

-- Jobs: service role only (no user-facing reads needed yet)
-- Credits: users can read their own
CREATE POLICY "users_read_own_credits" ON public.credits
  FOR SELECT USING (auth.uid() = user_id);

-- Request logs: users can read their own
CREATE POLICY "users_read_own_request_logs" ON public.request_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Credit helpers ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount  integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.credits(user_id, balance, lifetime)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance  = credits.balance + p_amount,
        lifetime = credits.lifetime + p_amount,
        updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id uuid,
  p_amount  integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT balance INTO current_balance
  FROM public.credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.credits
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_credits     TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_credits TO service_role;
