-- meetings.speakers column was missing from the live DB (20260319_new_features.sql
-- had it in the CREATE TABLE but it was dropped/never applied on this instance).
-- Already applied live: ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS speakers ...
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS speakers jsonb DEFAULT '{}'::jsonb;
