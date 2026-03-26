-- Create discount_codes table
-- Used by /api/admin/discount-codes and /api/discount-codes/validate + use routes

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text        NOT NULL UNIQUE,
  discount_percent integer     NOT NULL,
  max_uses         integer     NOT NULL DEFAULT 0,
  used_count       integer     NOT NULL DEFAULT 0,
  expires_at       timestamptz,
  plan_key         text,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by code
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
-- Index for admin listing by active status
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON public.discount_codes(is_active, created_at DESC);

-- RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active codes (needed for validation at checkout)
CREATE POLICY "discount_codes: authenticated read active"
  ON public.discount_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- All write operations (insert, update) are done via service client in admin routes
-- so no additional policies needed for mutations
