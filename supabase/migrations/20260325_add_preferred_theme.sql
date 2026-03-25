ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_theme text DEFAULT 'system';
