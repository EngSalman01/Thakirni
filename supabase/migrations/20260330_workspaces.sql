-- ─── Workspace Architecture ────────────────────────────────────────────────────
-- Unified personal + team workspaces.
-- Individuals → personal workspace (auto-created on signup)
-- Companies   → team workspace (linked to existing teams table)
-- All additive: no existing columns removed, no constraints changed.

-- ─── 1. workspaces ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspaces (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  type        text        NOT NULL DEFAULT 'personal'
    CHECK (type IN ('personal', 'team')),
  owner_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- For team workspaces: links back to the existing teams table
  team_id     uuid        REFERENCES public.teams(id) ON DELETE CASCADE,
  slug        text        UNIQUE,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  -- Enforce: one personal workspace per user
  CONSTRAINT unique_personal_per_user EXCLUDE USING btree (owner_id WITH =)
    WHERE (type = 'personal')
);

-- ─── 2. workspace_members ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         text        NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  invited_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- ─── 3. RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.workspaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspaces: members can see workspaces they belong to
CREATE POLICY "workspace_member_select" ON public.workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Workspace owner can update their workspace
CREATE POLICY "workspace_owner_update" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Workspace_members: users can see their own memberships
CREATE POLICY "wm_own_select" ON public.workspace_members
  FOR SELECT USING (user_id = auth.uid());

-- Workspace owners/admins can see all members of their workspaces
CREATE POLICY "wm_workspace_admin_select" ON public.workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- ─── 4. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workspaces_owner      ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_team       ON public.workspaces(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workspaces_type       ON public.workspaces(type);
CREATE INDEX IF NOT EXISTS idx_wm_workspace          ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wm_user               ON public.workspace_members(user_id);

-- ─── 5. Add workspace_id to key tables (nullable, additive) ──────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.usage
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.credits
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- ─── 6. Fix: add profiles.team_id (referenced by invite code but never created)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id) WHERE team_id IS NOT NULL;

-- ─── 7. Workspace indexes on child tables ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_workspace      ON public.projects(workspace_id)       WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usage_workspace         ON public.usage(workspace_id)          WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credits_workspace       ON public.credits(workspace_id)        WHERE workspace_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_workspace     ON public.analytics_events(workspace_id) WHERE workspace_id IS NOT NULL;

-- ─── 8. create_personal_workspace() helper ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_personal_workspace(p_user_id uuid, p_name text DEFAULT NULL)
RETURNS public.workspaces
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_workspace public.workspaces;
  v_name      text;
BEGIN
  v_name := COALESCE(p_name, 'My Workspace');

  INSERT INTO public.workspaces (name, type, owner_id)
  VALUES (v_name, 'personal', p_user_id)
  ON CONFLICT DO NOTHING
  RETURNING * INTO v_workspace;

  IF v_workspace.id IS NULL THEN
    -- Already exists (conflict), fetch it
    SELECT * INTO v_workspace
    FROM public.workspaces
    WHERE owner_id = p_user_id AND type = 'personal'
    LIMIT 1;
  END IF;

  -- Add user as owner member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace.id, p_user_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN v_workspace;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_personal_workspace TO service_role, authenticated;

-- ─── 9. create_team_workspace() helper ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_team_workspace(
  p_team_id  uuid,
  p_owner_id uuid,
  p_name     text
)
RETURNS public.workspaces
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_workspace public.workspaces;
BEGIN
  INSERT INTO public.workspaces (name, type, owner_id, team_id, slug)
  VALUES (
    p_name, 'team', p_owner_id, p_team_id,
    'team-' || p_team_id::text
  )
  ON CONFLICT DO NOTHING
  RETURNING * INTO v_workspace;

  IF v_workspace.id IS NULL THEN
    SELECT * INTO v_workspace
    FROM public.workspaces
    WHERE team_id = p_team_id
    LIMIT 1;
  END IF;

  -- Add owner as owner member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace.id, p_owner_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN v_workspace;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_team_workspace TO service_role;

-- ─── 10. Update handle_new_user trigger to also create personal workspace ──────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name text;
BEGIN
  v_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- Create profile
  INSERT INTO public.profiles (id, full_name, avatar_url, preferred_language)
  VALUES (
    new.id,
    v_name,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'ar')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create personal workspace
  PERFORM public.create_personal_workspace(new.id, v_name || '''s Workspace');

  RETURN new;
END;
$$;

-- ─── 11. Backfill: personal workspaces for ALL existing users ─────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.id, p.full_name
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.owner_id = p.id AND w.type = 'personal'
    )
  LOOP
    PERFORM public.create_personal_workspace(
      r.id,
      COALESCE(r.full_name, 'My') || '''s Workspace'
    );
  END LOOP;
END;
$$;

-- ─── 12. Backfill: team workspaces for ALL existing teams ─────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.id, t.owner_id, t.name
    FROM public.teams t
    WHERE NOT EXISTS (
      SELECT 1 FROM public.workspaces w
      WHERE w.team_id = t.id
    )
  LOOP
    PERFORM public.create_team_workspace(r.id, r.owner_id, r.name);
    -- Add all team members to the workspace
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    SELECT
      (SELECT id FROM public.workspaces WHERE team_id = r.id LIMIT 1),
      tm.user_id,
      tm.role
    FROM public.team_members tm
    WHERE tm.team_id = r.id
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END LOOP;
END;
$$;

-- ─── 13. Backfill workspace_id on usage records (link to personal workspace) ──
UPDATE public.usage u
SET workspace_id = (
  SELECT w.id FROM public.workspaces w
  WHERE w.owner_id = u.user_id AND w.type = 'personal'
  LIMIT 1
)
WHERE u.workspace_id IS NULL;

-- ─── 14. Backfill workspace_id on credits records ─────────────────────────────
UPDATE public.credits c
SET workspace_id = (
  SELECT w.id FROM public.workspaces w
  WHERE w.owner_id = c.user_id AND w.type = 'personal'
  LIMIT 1
)
WHERE c.workspace_id IS NULL;

-- ─── 15. Backfill workspace_id on analytics_events ───────────────────────────
UPDATE public.analytics_events ae
SET workspace_id = (
  SELECT w.id FROM public.workspaces w
  WHERE w.owner_id = ae.user_id AND w.type = 'personal'
  LIMIT 1
)
WHERE ae.workspace_id IS NULL AND ae.user_id IS NOT NULL;
