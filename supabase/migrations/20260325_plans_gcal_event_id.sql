ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS gcal_event_id TEXT;
