-- ─── DB Improvements (performance, monetization, analytics) ──────────────────
-- Safe additions only: IF NOT EXISTS everywhere, no breaking changes

-- ─── 1. profiles: retention + soft-delete ─────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at     timestamptz;

-- Partial index: fast lookup of non-deleted users
CREATE INDEX IF NOT EXISTS idx_profiles_active
  ON public.profiles(id) WHERE deleted_at IS NULL;

-- ─── 2. analytics_events: funnel tracking ─────────────────────────────────────
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS platform   text DEFAULT 'web'
    CHECK (platform IN ('web', 'whatsapp', 'mobile', 'api'));

-- ─── 3. jobs: historical query index ──────────────────────────────────────────
-- (idx_jobs_status_run_at already covers pending jobs — this covers all statuses)
CREATE INDEX IF NOT EXISTS idx_jobs_status_created
  ON public.jobs(status, created_at DESC);

-- ─── 4. credit_transactions: full audit trail ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     integer     NOT NULL,
  type       text        NOT NULL
    CHECK (type IN ('purchase', 'usage', 'bonus', 'referral', 'refund', 'expiry')),
  description text,
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_credit_transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_id
  ON public.credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_tx_type
  ON public.credit_transactions(type);

-- ─── 5. Helper: record_credit_transaction ─────────────────────────────────────
-- Call this whenever credits are added or spent to keep a full ledger
CREATE OR REPLACE FUNCTION public.record_credit_transaction(
  p_user_id    uuid,
  p_amount     integer,
  p_type       text,
  p_description text DEFAULT NULL,
  p_metadata   jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.credit_transactions(user_id, amount, type, description, metadata)
  VALUES (p_user_id, p_amount, p_type, p_description, p_metadata);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_credit_transaction TO service_role;
