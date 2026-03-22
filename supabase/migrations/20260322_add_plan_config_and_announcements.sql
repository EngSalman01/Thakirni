-- ── plan_config ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plan_config (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key        text        NOT NULL UNIQUE,
  display_name    text        NOT NULL,
  price_sar       numeric     NOT NULL DEFAULT 0,
  paddle_price_id text,
  paddle_product_id text,
  features        text[]      NOT NULL DEFAULT '{}',
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Seed default plans (skip if already seeded)
INSERT INTO public.plan_config (plan_key, display_name, price_sar, features, is_active)
VALUES
  ('free',  'Free',  0,     ARRAY['10 plans per day', '25 memories', '1 project', 'Basic AI chat', 'Habit & goal tracking'], true),
  ('pro',   'Pro',   29.99, ARRAY['100 plans per day', '1,000 memories', '10 projects', '30 meeting summaries/month', '50 document AI/month', '300 min voice/month', 'Analytics & reports'], true),
  ('teams', 'Teams', 59.99, ARRAY['Everything unlimited', 'Unlimited team members', 'Unlimited projects', 'Unlimited meeting summaries', 'Shared memories & notes', 'Priority support'], true)
ON CONFLICT (plan_key) DO NOTHING;

-- RLS
ALTER TABLE public.plan_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_config: service role all" ON public.plan_config;
CREATE POLICY "plan_config: service role all"
  ON public.plan_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── announcements ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  message     text        NOT NULL,
  target      text        NOT NULL DEFAULT 'all',
  channel     text        NOT NULL DEFAULT 'banner',
  sent_at     timestamptz,
  sent_count  integer     NOT NULL DEFAULT 0,
  created_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements: service role all" ON public.announcements;
CREATE POLICY "announcements: service role all"
  ON public.announcements FOR ALL
  USING (true)
  WITH CHECK (true);
