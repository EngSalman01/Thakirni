-- consent_logs: track user consent to data processing
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version      text        NOT NULL DEFAULT '1.0',
  accepted_at  timestamptz NOT NULL DEFAULT now(),
  ip_address   text,
  UNIQUE(user_id, version)
);
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_consent" ON public.consent_logs FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON public.consent_logs(user_id);

-- audit_logs: immutable event log (append-only via RLS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type   text        NOT NULL,
  description  text,
  metadata     jsonb       DEFAULT '{}',
  ip_address   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Users can read their own audit logs; no update/delete allowed via RLS
CREATE POLICY "users_read_own_audit" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);

-- invoices: ZATCA-ready billing records
CREATE TABLE IF NOT EXISTS public.invoices (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  invoice_number  text        NOT NULL UNIQUE,
  amount          numeric(10,2) NOT NULL,
  vat_amount      numeric(10,2) NOT NULL DEFAULT 0,
  total_amount    numeric(10,2) NOT NULL,
  currency        text        NOT NULL DEFAULT 'SAR',
  status          text        NOT NULL DEFAULT 'paid' CHECK (status IN ('pending','paid','refunded','void')),
  description     text,
  paddle_tx_id    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_own_invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- Helper: create_audit_log
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id    uuid,
  p_event_type text,
  p_description text DEFAULT NULL,
  p_metadata   jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs(user_id, event_type, description, metadata)
  VALUES (p_user_id, p_event_type, p_description, p_metadata);
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_audit_log TO service_role;

-- Helper: has_consented
CREATE OR REPLACE FUNCTION public.has_consented(p_user_id uuid, p_version text DEFAULT '1.0')
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.consent_logs WHERE user_id = p_user_id AND version = p_version);
$$;
GRANT EXECUTE ON FUNCTION public.has_consented TO service_role, authenticated;
