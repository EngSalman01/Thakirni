-- ─── B2B Growth Systems ────────────────────────────────────────────────────────
-- Leads (CRM), Affiliates, Partner Codes, Business Accounts

-- ─── 1. leads (CRM pipeline) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text        NOT NULL,
  email        text        NOT NULL,
  company      text,
  phone        text,
  team_size    text,       -- '1-10', '11-50', '51-200', '200+'
  use_case     text,
  message      text,
  source       text        NOT NULL DEFAULT 'enterprise_form',
  status       text        NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'demo_scheduled', 'closed_won', 'closed_lost')),
  notes        text,
  assigned_to  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- service_role only — leads are internal CRM data

CREATE INDEX IF NOT EXISTS idx_leads_status     ON public.leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email      ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_source     ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created    ON public.leads(created_at DESC);

-- ─── 2. affiliates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliates (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code            text        NOT NULL UNIQUE,
  commission_rate numeric(5,2) NOT NULL DEFAULT 20.00,
  status          text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'suspended')),
  total_referred  integer     NOT NULL DEFAULT 0,
  total_revenue   numeric(10,2) NOT NULL DEFAULT 0,
  total_paid      numeric(10,2) NOT NULL DEFAULT 0,
  pending_payout  numeric(10,2) NOT NULL DEFAULT 0,
  payout_email    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliates_own_select" ON public.affiliates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "affiliates_own_update" ON public.affiliates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_affiliates_code   ON public.affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliates_user   ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);

-- ─── 3. affiliate_conversions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id     uuid        NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_purchased   text,
  revenue          numeric(10,2) NOT NULL DEFAULT 0,
  commission       numeric(10,2) NOT NULL DEFAULT 0,
  status           text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'paid', 'reversed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "affiliate_conversions_own_select" ON public.affiliate_conversions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_id AND a.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_aff_conv_affiliate ON public.affiliate_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_aff_conv_user      ON public.affiliate_conversions(referred_user_id);

-- ─── 4. Extend discount_codes with partner fields ─────────────────────────────
ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS partner_name text,
  ADD COLUMN IF NOT EXISTS partner_type text
    CHECK (partner_type IN ('university', 'sme', 'coach', 'corporate', 'affiliate', NULL)),
  ADD COLUMN IF NOT EXISTS is_partner   boolean NOT NULL DEFAULT false;

-- ─── 5. business_accounts (B2B company seats) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_accounts (
  id                     uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id                uuid    REFERENCES public.teams(id) ON DELETE CASCADE,
  company_name           text    NOT NULL,
  company_size           text,
  industry               text,
  country                text    NOT NULL DEFAULT 'SA',
  currency               text    NOT NULL DEFAULT 'SAR',
  max_seats              integer NOT NULL DEFAULT 5,
  used_seats             integer NOT NULL DEFAULT 0,
  billing_contact_email  text,
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_accounts_team_select" ON public.business_accounts
  FOR SELECT USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_business_accounts_team ON public.business_accounts(team_id);

-- ─── 6. customer_health (for customer success tracking) ──────────────────────
CREATE TABLE IF NOT EXISTS public.customer_health (
  user_id        uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  health_score   integer NOT NULL DEFAULT 50 CHECK (health_score BETWEEN 0 AND 100),
  -- score bands: 0-30 at-risk, 31-60 neutral, 61-100 healthy
  last_active_at timestamptz,
  sessions_30d   integer NOT NULL DEFAULT 0,
  messages_30d   integer NOT NULL DEFAULT 0,
  memories_30d   integer NOT NULL DEFAULT 0,
  risk_flags     text[]  DEFAULT '{}',   -- e.g. ['no_login_14d', 'zero_memories']
  reached_out_at timestamptz,           -- last customer-success outreach
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_health_own_select" ON public.customer_health
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_customer_health_score ON public.customer_health(health_score);
CREATE INDEX IF NOT EXISTS idx_customer_health_risk  ON public.customer_health(health_score, updated_at DESC)
  WHERE health_score < 31;

-- ─── 7. RPC: upsert_customer_health ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_customer_health(
  p_user_id      uuid,
  p_sessions     integer DEFAULT 0,
  p_messages     integer DEFAULT 0,
  p_memories     integer DEFAULT 0,
  p_last_active  timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_score integer;
  v_flags text[] := '{}';
BEGIN
  -- Compute score: sessions(40%) + messages(30%) + memories(30%)
  v_score := LEAST(100,
    LEAST(40, p_sessions * 4) +
    LEAST(30, p_messages * 2) +
    LEAST(30, p_memories * 3)
  );

  -- Risk flags
  IF p_last_active < now() - interval '14 days' THEN
    v_flags := array_append(v_flags, 'no_login_14d');
  END IF;
  IF p_sessions = 0 THEN
    v_flags := array_append(v_flags, 'zero_sessions');
  END IF;
  IF p_memories = 0 THEN
    v_flags := array_append(v_flags, 'zero_memories');
  END IF;

  INSERT INTO public.customer_health(
    user_id, health_score, last_active_at,
    sessions_30d, messages_30d, memories_30d,
    risk_flags, updated_at
  )
  VALUES (
    p_user_id, v_score, p_last_active,
    p_sessions, p_messages, p_memories,
    v_flags, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    health_score   = EXCLUDED.health_score,
    last_active_at = EXCLUDED.last_active_at,
    sessions_30d   = EXCLUDED.sessions_30d,
    messages_30d   = EXCLUDED.messages_30d,
    memories_30d   = EXCLUDED.memories_30d,
    risk_flags     = EXCLUDED.risk_flags,
    updated_at     = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_customer_health TO service_role;
