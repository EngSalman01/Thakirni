-- Add audio_storage_path column so the upload route can store the Supabase
-- Storage path before background processing starts.
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS audio_storage_path text;
