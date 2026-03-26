-- ================================================================
-- Migration: 20260326_gcal_preferences
-- Adds Google Calendar sync preferences to profiles and a table
-- to track which GCal events have already had WhatsApp reminders sent.
-- ================================================================

-- 1. Add gcal_auto_sync: auto-push new plans to Google Calendar
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gcal_auto_sync BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add gcal_whatsapp_reminders: send WhatsApp reminder 30 min before GCal events
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gcal_whatsapp_reminders BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Table to track sent GCal event reminders (prevents duplicate WhatsApp messages)
CREATE TABLE IF NOT EXISTS public.gcal_sent_reminders (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id   TEXT        NOT NULL,
  reminded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_id)
);

-- 4. RLS
ALTER TABLE public.gcal_sent_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read own gcal reminders"
  ON public.gcal_sent_reminders FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Auto-cleanup: delete reminder records older than 7 days to keep table small
CREATE INDEX IF NOT EXISTS idx_gcal_sent_reminders_user_id
  ON public.gcal_sent_reminders (user_id);

CREATE INDEX IF NOT EXISTS idx_gcal_sent_reminders_reminded_at
  ON public.gcal_sent_reminders (reminded_at);
