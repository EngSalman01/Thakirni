-- ================================================================
-- Migration: 20260325_improvements
-- Safe incremental improvements extracted from expert schema review.
-- Operations:
--   1. Add is_admin column to profiles
--   2. Add index on is_admin
--   3. Create is_team_member() helper function
--   4. Create is_team_admin() helper function
-- All operations are idempotent (safe to run more than once).
-- ================================================================

-- 1. Add is_admin column (only if it doesn't already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
  ON public.profiles(is_admin);

-- 3. Helper function: check if current user is a member of a team
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
  );
$$;

-- 4. Helper function: check if current user is an owner or admin of a team
CREATE OR REPLACE FUNCTION public.is_team_admin(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;
