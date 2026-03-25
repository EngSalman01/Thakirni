-- Add Google Calendar OAuth token columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_calendar_token          TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token  TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_expires_at     TIMESTAMPTZ;
