-- ================================================================
-- Fix: infinite recursion in team_members RLS policies
--
-- Root cause: policies on team_members, teams, projects, etc. all
-- query the team_members table inside their USING clause. When
-- PostgreSQL evaluates those subqueries it re-applies team_members
-- RLS → recurses forever.
--
-- Fix: SECURITY DEFINER helper functions that bypass RLS, so
-- policies can call them without triggering themselves.
--
-- Run this in Supabase → SQL Editor → New query → Run
-- ================================================================


-- ── Step 1: Helper functions (bypass RLS with security definer) ──

-- Returns every team_id the current user belongs to
create or replace function public.get_my_team_ids()
returns setof uuid
language sql security definer stable
set search_path = public as $$
  select team_id from public.team_members
  where user_id = auth.uid();
$$;

-- Returns the current user's role in a specific team (null if not a member)
create or replace function public.get_my_team_role(p_team_id uuid)
returns text
language sql security definer stable
set search_path = public as $$
  select role from public.team_members
  where team_id = p_team_id and user_id = auth.uid()
  limit 1;
$$;

-- Returns every project_id the current user has access to (via team membership)
create or replace function public.get_my_project_ids()
returns setof uuid
language sql security definer stable
set search_path = public as $$
  select p.id from public.projects p
  where p.team_id in (select public.get_my_team_ids());
$$;


-- ── Step 2: Drop all recursive / team-referencing policies ───────

drop policy if exists "team_members: team select"        on public.team_members;
drop policy if exists "team_members: admin all"          on public.team_members;
drop policy if exists "teams: members select"            on public.teams;
drop policy if exists "team_invitations: admin all"      on public.team_invitations;
drop policy if exists "projects: team select"            on public.projects;
drop policy if exists "projects: member all"             on public.projects;
drop policy if exists "project_columns: team select"     on public.project_columns;
drop policy if exists "project_columns: member all"      on public.project_columns;
drop policy if exists "project_tasks: team select"       on public.project_tasks;
drop policy if exists "project_tasks: member all"        on public.project_tasks;
drop policy if exists "task_comments: team select"       on public.task_comments;
drop policy if exists "plans: team select"               on public.plans;
drop policy if exists "plans: team member all"           on public.plans;
drop policy if exists "memories: shared team select"     on public.memories;
drop policy if exists "subscriptions: team select"       on public.subscriptions;


-- ── Step 3: Recreate policies using helper functions (no recursion)

-- team_members ────────────────────────────────────────────────────
create policy "team_members: team select"
  on public.team_members for select
  using (team_id in (select public.get_my_team_ids()));

create policy "team_members: admin all"
  on public.team_members for all
  using (public.get_my_team_role(team_id) in ('owner', 'admin'));

-- teams ───────────────────────────────────────────────────────────
create policy "teams: members select"
  on public.teams for select
  using (id in (select public.get_my_team_ids()));

-- team_invitations ────────────────────────────────────────────────
create policy "team_invitations: admin all"
  on public.team_invitations for all
  using (public.get_my_team_role(team_id) in ('owner', 'admin'));

-- projects ────────────────────────────────────────────────────────
create policy "projects: team select"
  on public.projects for select
  using (team_id in (select public.get_my_team_ids()));

create policy "projects: member all"
  on public.projects for all
  using (public.get_my_team_role(team_id) in ('owner', 'admin', 'member'));

-- project_columns ─────────────────────────────────────────────────
create policy "project_columns: team select"
  on public.project_columns for select
  using (project_id in (select public.get_my_project_ids()));

create policy "project_columns: member all"
  on public.project_columns for all
  using (
    project_id in (
      select p.id from public.projects p
      where p.team_id in (select public.get_my_team_ids())
        and public.get_my_team_role(p.team_id) in ('owner', 'admin', 'member')
    )
  );

-- project_tasks ───────────────────────────────────────────────────
create policy "project_tasks: team select"
  on public.project_tasks for select
  using (project_id in (select public.get_my_project_ids()));

create policy "project_tasks: member all"
  on public.project_tasks for all
  using (
    project_id in (
      select p.id from public.projects p
      where p.team_id in (select public.get_my_team_ids())
        and public.get_my_team_role(p.team_id) in ('owner', 'admin', 'member')
    )
  );

-- task_comments ───────────────────────────────────────────────────
create policy "task_comments: team select"
  on public.task_comments for select
  using (
    task_id in (
      select pt.id from public.project_tasks pt
      where pt.project_id in (select public.get_my_project_ids())
    )
  );

-- plans ───────────────────────────────────────────────────────────
create policy "plans: team select"
  on public.plans for select
  using (
    team_id is not null
    and team_id in (select public.get_my_team_ids())
  );

create policy "plans: team member all"
  on public.plans for all
  using (
    team_id is not null
    and public.get_my_team_role(team_id) in ('owner', 'admin', 'member')
  );

-- memories ────────────────────────────────────────────────────────
create policy "memories: shared team select"
  on public.memories for select
  using (
    is_shared = true
    and team_id is not null
    and team_id in (select public.get_my_team_ids())
  );

-- subscriptions ───────────────────────────────────────────────────
create policy "subscriptions: team select"
  on public.subscriptions for select
  using (
    team_id is not null
    and team_id in (select public.get_my_team_ids())
  );

-- ================================================================
-- Done. All policies now use security-definer functions — no more
-- infinite recursion.
-- ================================================================
