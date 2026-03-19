-- ================================================================
-- THAKIRNI — Complete Database Schema  v4.0 · 2026-03-19
--
-- Paste the ENTIRE file into Supabase → SQL Editor → New query
-- Structure:
--   PART 1 · All tables          (in FK dependency order)
--   PART 2 · Enable RLS
--   PART 3 · All policies        (after all tables exist)
--   PART 4 · All indexes
--   PART 5 · Trigger functions
--   PART 6 · Triggers
-- ================================================================

create extension if not exists "pgcrypto";


-- ================================================================
-- PART 1 — TABLES
-- ================================================================

-- 1. profiles ─────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                 uuid        primary key references auth.users(id) on delete cascade,
  full_name          text,
  avatar_url         text,
  phone_number       text        unique,
  preferred_language text        not null default 'ar'
                                 check (preferred_language in ('ar', 'en')),
  timezone           text        not null default 'Asia/Riyadh',
  plan_tier          text        not null default 'FREE'
                                 check (plan_tier in ('FREE', 'INDIVIDUAL', 'COMPANY')),
  paddle_customer_id text        unique,
  onboarded_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 2. teams ────────────────────────────────────────────────────────
create table if not exists public.teams (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  description text,
  avatar_url  text,
  owner_id    uuid        not null references auth.users(id) on delete restrict,
  plan_tier   text        not null default 'FREE'
                          check (plan_tier in ('FREE', 'INDIVIDUAL', 'COMPANY')),
  max_members integer     not null default 5,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3. team_members ─────────────────────────────────────────────────
create table if not exists public.team_members (
  id        uuid        primary key default gen_random_uuid(),
  team_id   uuid        not null references public.teams(id) on delete cascade,
  user_id   uuid        not null references auth.users(id)   on delete cascade,
  role      text        not null default 'member'
                        check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

-- 4. team_invitations ─────────────────────────────────────────────
create table if not exists public.team_invitations (
  id          uuid        primary key default gen_random_uuid(),
  team_id     uuid        not null references public.teams(id) on delete cascade,
  invited_by  uuid        not null references auth.users(id)   on delete cascade,
  email       text,
  role        text        not null default 'member'
                          check (role in ('admin', 'member', 'viewer')),
  token       text        not null unique default encode(gen_random_bytes(32), 'hex'),
  status      text        not null default 'pending'
                          check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- 5. projects ─────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid        primary key default gen_random_uuid(),
  team_id     uuid        not null references public.teams(id) on delete cascade,
  owner_id    uuid        references auth.users(id) on delete set null,
  name        text        not null,
  description text,
  color       text        not null default '#2552ca',
  icon        text        not null default 'folder',
  status      text        not null default 'active'
                          check (status in ('active', 'archived', 'completed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 6. project_columns ──────────────────────────────────────────────
create table if not exists public.project_columns (
  id         uuid        primary key default gen_random_uuid(),
  project_id uuid        not null references public.projects(id) on delete cascade,
  title      text        not null,
  position   integer     not null default 0,
  color      text        not null default '#94a3b8',
  created_at timestamptz not null default now()
);

-- 7. project_tasks ────────────────────────────────────────────────
create table if not exists public.project_tasks (
  id           uuid        primary key default gen_random_uuid(),
  project_id   uuid        not null references public.projects(id)        on delete cascade,
  column_id    uuid        not null references public.project_columns(id)  on delete cascade,
  created_by   uuid        not null references auth.users(id) on delete restrict,
  assigned_to  uuid        references auth.users(id) on delete set null,
  title        text        not null,
  description  text,
  position     integer     not null default 0,
  priority     text        not null default 'medium'
                           check (priority in ('low', 'medium', 'high')),
  due_date     date,
  labels       text[]      not null default '{}',
  is_completed boolean     not null default false,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 8. task_comments ────────────────────────────────────────────────
create table if not exists public.task_comments (
  id         uuid        primary key default gen_random_uuid(),
  task_id    uuid        not null references public.project_tasks(id) on delete cascade,
  user_id    uuid        not null references auth.users(id)           on delete cascade,
  content    text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. memories ─────────────────────────────────────────────────────
create table if not exists public.memories (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  team_id        uuid        references public.teams(id) on delete set null,
  type           text        not null default 'text'
                             check (type in ('text', 'photo', 'voice')),
  title          text,
  content        text,
  content_url    text,
  tags           text[]      not null default '{}',
  hijri_date     text,
  gregorian_date date        not null default current_date,
  is_shared      boolean     not null default false,
  is_pinned      boolean     not null default false,
  ai_summary     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 10. plans ───────────────────────────────────────────────────────
create table if not exists public.plans (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id)   on delete cascade,
  team_id      uuid        references public.teams(id)          on delete set null,
  project_id   uuid        references public.projects(id)       on delete set null,
  assigned_to  uuid        references auth.users(id)            on delete set null,
  title        text        not null,
  description  text,
  location     text,
  attendees    text[]      not null default '{}',
  plan_date    date        not null default current_date,
  plan_time    time,
  end_time     time,
  is_all_day   boolean     not null default false,
  category     text        not null default 'task'
                           check (category in ('task','meeting','grocery','work','personal','health','finance','other')),
  priority     text        not null default 'medium'
                           check (priority in ('low', 'medium', 'high')),
  status       text        not null default 'pending'
                           check (status in ('pending', 'done', 'cancelled')),
  recurrence   text        not null default 'none'
                           check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 11. reminders ───────────────────────────────────────────────────
create table if not exists public.reminders (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  plan_id         uuid        references public.plans(id)        on delete cascade,
  title           text        not null,
  body            text,
  remind_at       timestamptz not null,
  channel         text        not null default 'push'
                              check (channel in ('push', 'whatsapp', 'email')),
  is_sent         boolean     not null default false,
  sent_at         timestamptz,
  is_recurring    boolean     not null default false,
  recurrence_rule text,
  created_at      timestamptz not null default now()
);

-- 12. user_facts ──────────────────────────────────────────────────
create table if not exists public.user_facts (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  fact       text        not null,
  category   text        not null default 'general'
                         check (category in (
                           'work','family','health','finance',
                           'preference','location','education','contact','general'
                         )),
  confidence float       not null default 1.0
                         check (confidence >= 0 and confidence <= 1),
  source     text        not null default 'conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 13. conversations ───────────────────────────────────────────────
create table if not exists public.conversations (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  session_id  uuid        not null default gen_random_uuid(),
  role        text        not null check (role in ('user', 'assistant', 'system')),
  content     text        not null,
  tool_calls  jsonb,
  token_count integer,
  created_at  timestamptz not null default now()
);

-- 14. timeline_events ─────────────────────────────────────────────
create table if not exists public.timeline_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  title       text        not null,
  description text,
  event_date  date        not null default current_date,
  source_type text        not null default 'note_added'
                          check (source_type in (
                            'plan_created','plan_completed','memory_saved',
                            'file_uploaded','voice_recorded','fact_learned','note_added'
                          )),
  source_id   uuid,
  importance  integer     not null default 1
                          check (importance >= 1 and importance <= 5),
  metadata    jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

-- 15. subscriptions ───────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                     uuid        primary key default gen_random_uuid(),
  user_id                uuid        references auth.users(id)   on delete cascade,
  team_id                uuid        references public.teams(id)  on delete cascade,
  paddle_subscription_id text        unique,
  paddle_customer_id     text,
  paddle_transaction_id  text,
  plan_tier              text        not null default 'FREE'
                                     check (plan_tier in ('FREE', 'INDIVIDUAL', 'COMPANY')),
  billing_cycle          text        check (billing_cycle in ('monthly', 'yearly')),
  status                 text        not null default 'inactive'
                                     check (status in ('active','inactive','trialing','past_due','cancelled')),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  next_billing_date      timestamptz,
  cancel_at_period_end   boolean     not null default false,
  cancelled_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- 16. whatsapp_connections ────────────────────────────────────────
create table if not exists public.whatsapp_connections (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null unique references auth.users(id) on delete cascade,
  phone_number text        not null unique,
  is_verified  boolean     not null default false,
  verified_at  timestamptz,
  opt_in       boolean     not null default true,
  created_at   timestamptz not null default now()
);

-- 17. whatsapp_messages ───────────────────────────────────────────
create table if not exists public.whatsapp_messages (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  direction    text        not null check (direction in ('inbound', 'outbound')),
  content      text        not null,
  media_url    text,
  media_type   text,
  intent       text,
  is_processed boolean     not null default false,
  kapso_msg_id text        unique,
  created_at   timestamptz not null default now()
);

-- 18. notifications ───────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  title      text        not null,
  body       text,
  type       text        not null default 'info'
                         check (type in ('info','success','warning','error','reminder')),
  action_url text,
  is_read    boolean     not null default false,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- 19. waitlist ────────────────────────────────────────────────────
create table if not exists public.waitlist (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null unique,
  plan_type  text        default 'free'
                         check (plan_type in ('free', 'individual', 'company')),
  country    text,
  referral   text,
  status     text        not null default 'pending'
                         check (status in ('pending', 'invited', 'converted')),
  created_at timestamptz not null default now()
);


-- ================================================================
-- PART 2 — ENABLE RLS
-- (all tables must exist before any policy can reference them)
-- ================================================================
alter table public.profiles             enable row level security;
alter table public.teams                enable row level security;
alter table public.team_members         enable row level security;
alter table public.team_invitations     enable row level security;
alter table public.projects             enable row level security;
alter table public.project_columns      enable row level security;
alter table public.project_tasks        enable row level security;
alter table public.task_comments        enable row level security;
alter table public.memories             enable row level security;
alter table public.plans                enable row level security;
alter table public.reminders            enable row level security;
alter table public.user_facts           enable row level security;
alter table public.conversations        enable row level security;
alter table public.timeline_events      enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_messages    enable row level security;
alter table public.notifications        enable row level security;
alter table public.waitlist             enable row level security;


-- ================================================================
-- PART 3 — POLICIES
-- ================================================================

-- profiles ────────────────────────────────────────────────────────
create policy "profiles: own select"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: own insert"
  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: own update"
  on public.profiles for update using (auth.uid() = id);

-- teams ───────────────────────────────────────────────────────────
create policy "teams: members select"
  on public.teams for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = teams.id and tm.user_id = auth.uid()
    )
  );
create policy "teams: owner insert"
  on public.teams for insert with check (auth.uid() = owner_id);
create policy "teams: owner update"
  on public.teams for update using (auth.uid() = owner_id);
create policy "teams: owner delete"
  on public.teams for delete using (auth.uid() = owner_id);

-- team_members ────────────────────────────────────────────────────
create policy "team_members: team select"
  on public.team_members for select
  using (
    exists (
      select 1 from public.team_members tm2
      where tm2.team_id = team_members.team_id and tm2.user_id = auth.uid()
    )
  );
create policy "team_members: admin all"
  on public.team_members for all
  using (
    exists (
      select 1 from public.team_members tm3
      where tm3.team_id = team_members.team_id
        and tm3.user_id = auth.uid()
        and tm3.role    in ('owner', 'admin')
    )
  );

-- team_invitations ────────────────────────────────────────────────
create policy "team_invitations: public select"
  on public.team_invitations for select using (true);
create policy "team_invitations: admin all"
  on public.team_invitations for all
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_invitations.team_id
        and tm.user_id = auth.uid()
        and tm.role    in ('owner', 'admin')
    )
  );

-- projects ────────────────────────────────────────────────────────
create policy "projects: team select"
  on public.projects for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = projects.team_id and tm.user_id = auth.uid()
    )
  );
create policy "projects: member all"
  on public.projects for all
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = projects.team_id
        and tm.user_id = auth.uid()
        and tm.role    in ('owner', 'admin', 'member')
    )
  );

-- project_columns ─────────────────────────────────────────────────
create policy "project_columns: team select"
  on public.project_columns for select
  using (
    exists (
      select 1 from public.projects p
      join  public.team_members tm on tm.team_id = p.team_id
      where p.id = project_columns.project_id and tm.user_id = auth.uid()
    )
  );
create policy "project_columns: member all"
  on public.project_columns for all
  using (
    exists (
      select 1 from public.projects p
      join  public.team_members tm on tm.team_id = p.team_id
      where p.id     = project_columns.project_id
        and tm.user_id = auth.uid()
        and tm.role    in ('owner', 'admin', 'member')
    )
  );

-- project_tasks ───────────────────────────────────────────────────
create policy "project_tasks: team select"
  on public.project_tasks for select
  using (
    exists (
      select 1 from public.projects p
      join  public.team_members tm on tm.team_id = p.team_id
      where p.id = project_tasks.project_id and tm.user_id = auth.uid()
    )
  );
create policy "project_tasks: member all"
  on public.project_tasks for all
  using (
    exists (
      select 1 from public.projects p
      join  public.team_members tm on tm.team_id = p.team_id
      where p.id     = project_tasks.project_id
        and tm.user_id = auth.uid()
        and tm.role    in ('owner', 'admin', 'member')
    )
  );

-- task_comments ───────────────────────────────────────────────────
create policy "task_comments: team select"
  on public.task_comments for select
  using (
    exists (
      select 1 from public.project_tasks pt
      join  public.projects     p  on p.id       = pt.project_id
      join  public.team_members tm on tm.team_id = p.team_id
      where pt.id = task_comments.task_id and tm.user_id = auth.uid()
    )
  );
create policy "task_comments: author all"
  on public.task_comments for all using (auth.uid() = user_id);

-- memories ────────────────────────────────────────────────────────
create policy "memories: own all"
  on public.memories for all using (auth.uid() = user_id);
create policy "memories: shared team select"
  on public.memories for select
  using (
    is_shared = true and team_id is not null
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = memories.team_id and tm.user_id = auth.uid()
    )
  );

-- plans ───────────────────────────────────────────────────────────
create policy "plans: own all"
  on public.plans for all using (auth.uid() = user_id);
create policy "plans: team select"
  on public.plans for select
  using (
    team_id is not null
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = plans.team_id and tm.user_id = auth.uid()
    )
  );
create policy "plans: team member all"
  on public.plans for all
  using (
    team_id is not null
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = plans.team_id
        and tm.user_id = auth.uid()
        and tm.role    in ('owner', 'admin', 'member')
    )
  );

-- reminders ───────────────────────────────────────────────────────
create policy "reminders: own all"
  on public.reminders for all using (auth.uid() = user_id);

-- user_facts (service-role only — no user policy) ─────────────────
-- AI reads and writes via service role which bypasses RLS.
-- Uncomment the line below to let users read their own facts:
-- create policy "user_facts: own select" on public.user_facts for select using (auth.uid() = user_id);

-- conversations ───────────────────────────────────────────────────
create policy "conversations: own select"
  on public.conversations for select using (auth.uid() = user_id);

-- timeline_events ─────────────────────────────────────────────────
create policy "timeline: own all"
  on public.timeline_events for all using (auth.uid() = user_id);

-- subscriptions ───────────────────────────────────────────────────
create policy "subscriptions: own select"
  on public.subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions: team select"
  on public.subscriptions for select
  using (
    team_id is not null
    and exists (
      select 1 from public.team_members tm
      where tm.team_id = subscriptions.team_id and tm.user_id = auth.uid()
    )
  );

-- whatsapp_connections ────────────────────────────────────────────
create policy "whatsapp_connections: own all"
  on public.whatsapp_connections for all using (auth.uid() = user_id);

-- whatsapp_messages ───────────────────────────────────────────────
create policy "whatsapp_messages: own select"
  on public.whatsapp_messages for select using (auth.uid() = user_id);

-- notifications ───────────────────────────────────────────────────
create policy "notifications: own all"
  on public.notifications for all using (auth.uid() = user_id);

-- waitlist ────────────────────────────────────────────────────────
create policy "waitlist: public insert"
  on public.waitlist for insert with check (true);
create policy "waitlist: service select"
  on public.waitlist for select using (false);


-- ================================================================
-- PART 4 — INDEXES
-- ================================================================
create index if not exists teams_owner_idx            on public.teams(owner_id);
create index if not exists team_members_team_idx      on public.team_members(team_id);
create index if not exists team_members_user_idx      on public.team_members(user_id);
create index if not exists team_invitations_token_idx on public.team_invitations(token);
create index if not exists team_invitations_team_idx  on public.team_invitations(team_id);
create index if not exists projects_team_idx          on public.projects(team_id);
create index if not exists project_columns_pos_idx    on public.project_columns(project_id, position);
create index if not exists project_tasks_project_idx  on public.project_tasks(project_id);
create index if not exists project_tasks_column_idx   on public.project_tasks(column_id, position);
create index if not exists project_tasks_assignee_idx on public.project_tasks(assigned_to);
create index if not exists task_comments_task_idx     on public.task_comments(task_id);
create index if not exists memories_user_idx          on public.memories(user_id);
create index if not exists memories_team_idx          on public.memories(team_id);
create index if not exists memories_date_idx          on public.memories(gregorian_date);
create index if not exists memories_tags_idx          on public.memories using gin(tags);
create index if not exists memories_recent_idx        on public.memories(user_id, created_at desc);
create index if not exists plans_user_date_idx        on public.plans(user_id, plan_date);
create index if not exists plans_user_status_idx      on public.plans(user_id, status);
create index if not exists plans_team_idx             on public.plans(team_id);
create index if not exists plans_today_idx            on public.plans(user_id, plan_date, plan_time) where status = 'pending';
create index if not exists reminders_user_idx         on public.reminders(user_id, remind_at) where is_sent = false;
create index if not exists reminders_due_idx          on public.reminders(remind_at) where is_sent = false;
create index if not exists user_facts_user_cat_idx    on public.user_facts(user_id, category);
create index if not exists conversations_user_idx     on public.conversations(user_id, created_at desc);
create index if not exists conversations_session_idx  on public.conversations(session_id);
create index if not exists timeline_user_date_idx     on public.timeline_events(user_id, event_date desc);
create index if not exists timeline_importance_idx    on public.timeline_events(user_id, event_date desc, importance desc);
create index if not exists subscriptions_user_idx     on public.subscriptions(user_id);
create index if not exists subscriptions_team_idx     on public.subscriptions(team_id);
create index if not exists subscriptions_paddle_idx   on public.subscriptions(paddle_customer_id);
create index if not exists whatsapp_msg_user_idx      on public.whatsapp_messages(user_id, created_at desc);
create index if not exists notifications_unread_idx   on public.notifications(user_id, created_at desc) where is_read = false;


-- ================================================================
-- PART 5 — TRIGGER FUNCTIONS
-- ================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'preferred_language', 'ar')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer as $$
begin
  insert into public.team_members (team_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (team_id, user_id) do nothing;
  return new;
end;
$$;

create or replace function public.seed_default_columns()
returns trigger language plpgsql security definer as $$
begin
  insert into public.project_columns (project_id, title, position, color) values
    (new.id, 'To Do',       0, '#94a3b8'),
    (new.id, 'In Progress', 1, '#2552ca'),
    (new.id, 'Done',        2, '#22c55e');
  return new;
end;
$$;

create or replace function public.log_plan_completed()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'done' and old.status <> 'done' then
    insert into public.timeline_events
      (user_id, title, event_date, source_type, source_id, importance)
    values (
      new.user_id,
      'Completed: ' || new.title,
      new.plan_date,
      'plan_completed',
      new.id,
      case new.priority when 'high' then 3 when 'medium' then 2 else 1 end
    );
  end if;
  return new;
end;
$$;

create or replace function public.log_memory_saved()
returns trigger language plpgsql security definer as $$
begin
  insert into public.timeline_events
    (user_id, title, description, event_date, source_type, source_id, importance)
  values (
    new.user_id,
    coalesce(new.title, 'Memory saved'),
    left(new.content, 200),
    coalesce(new.gregorian_date, current_date),
    'memory_saved',
    new.id,
    1
  );
  return new;
end;
$$;

create or replace function public.sync_profile_tier()
returns trigger language plpgsql security definer as $$
begin
  if new.user_id is not null then
    update public.profiles
    set
      plan_tier  = case when new.status = 'active' then new.plan_tier else 'FREE' end,
      updated_at = now()
    where id = new.user_id;
  end if;
  return new;
end;
$$;


-- ================================================================
-- PART 6 — TRIGGERS
-- ================================================================

-- updated_at
drop trigger if exists profiles_updated_at      on public.profiles;
create trigger profiles_updated_at      before update on public.profiles      for each row execute procedure public.set_updated_at();

drop trigger if exists teams_updated_at         on public.teams;
create trigger teams_updated_at         before update on public.teams         for each row execute procedure public.set_updated_at();

drop trigger if exists projects_updated_at      on public.projects;
create trigger projects_updated_at      before update on public.projects      for each row execute procedure public.set_updated_at();

drop trigger if exists project_tasks_updated_at on public.project_tasks;
create trigger project_tasks_updated_at before update on public.project_tasks for each row execute procedure public.set_updated_at();

drop trigger if exists task_comments_updated_at on public.task_comments;
create trigger task_comments_updated_at before update on public.task_comments for each row execute procedure public.set_updated_at();

drop trigger if exists memories_updated_at      on public.memories;
create trigger memories_updated_at      before update on public.memories      for each row execute procedure public.set_updated_at();

drop trigger if exists plans_updated_at         on public.plans;
create trigger plans_updated_at         before update on public.plans         for each row execute procedure public.set_updated_at();

drop trigger if exists user_facts_updated_at    on public.user_facts;
create trigger user_facts_updated_at    before update on public.user_facts    for each row execute procedure public.set_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.set_updated_at();

-- business logic
drop trigger if exists on_auth_user_created     on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists teams_add_owner          on public.teams;
create trigger teams_add_owner
  after insert on public.teams
  for each row execute procedure public.add_owner_as_member();

drop trigger if exists projects_seed_columns    on public.projects;
create trigger projects_seed_columns
  after insert on public.projects
  for each row execute procedure public.seed_default_columns();

drop trigger if exists plans_log_completed      on public.plans;
create trigger plans_log_completed
  after update on public.plans
  for each row execute procedure public.log_plan_completed();

drop trigger if exists memories_log_saved       on public.memories;
create trigger memories_log_saved
  after insert on public.memories
  for each row execute procedure public.log_memory_saved();

drop trigger if exists subscriptions_sync_tier  on public.subscriptions;
create trigger subscriptions_sync_tier
  after insert or update on public.subscriptions
  for each row execute procedure public.sync_profile_tier();


-- ================================================================
-- DONE ✓
-- 19 tables · 6 trigger functions · 15 triggers · 30+ indexes
-- ================================================================
