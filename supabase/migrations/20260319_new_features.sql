-- ================================================================
-- New Features Schema: Meetings, Goals, Habits, Focus, Documents
-- Run AFTER the complete_schema.sql migration
-- ================================================================


-- ── 1. MEETINGS ──────────────────────────────────────────────────────────────

create table if not exists public.meetings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  team_id         uuid references public.teams(id) on delete set null,
  title           text not null,
  duration_seconds integer,
  language        text default 'ar',
  speaker_count   integer default 2,
  speakers        jsonb default '{}'::jsonb,       -- {"Speaker 1": "Ahmed", ...}
  transcript      jsonb default '[]'::jsonb,       -- [{id, start, end, text, speaker}, ...]
  summary         text,
  key_points      text[] default '{}',
  action_items    text[] default '{}',
  file_size_bytes bigint,
  status          text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.meetings enable row level security;

create policy "meetings: owner all"
  on public.meetings for all
  using (user_id = auth.uid());

create policy "meetings: team select"
  on public.meetings for select
  using (
    team_id is not null
    and team_id in (select public.get_my_team_ids())
  );

create index if not exists meetings_user_id_idx on public.meetings(user_id);
create index if not exists meetings_created_at_idx on public.meetings(created_at desc);


-- ── 2. GOALS ─────────────────────────────────────────────────────────────────

create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  category      text not null default 'personal'
                  check (category in ('career','health','finance','education','personal','relationships','other')),
  progress      integer not null default 0 check (progress between 0 and 100),
  status        text not null default 'active' check (status in ('active','completed','paused','cancelled')),
  target_date   date,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.goal_milestones (
  id            uuid primary key default gen_random_uuid(),
  goal_id       uuid not null references public.goals(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  description   text,
  position      integer not null default 0,
  is_completed  boolean not null default false,
  target_date   date,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.goals enable row level security;
alter table public.goal_milestones enable row level security;

create policy "goals: owner all"
  on public.goals for all
  using (user_id = auth.uid());

create policy "goal_milestones: owner all"
  on public.goal_milestones for all
  using (user_id = auth.uid());

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goal_milestones_goal_id_idx on public.goal_milestones(goal_id);


-- ── 3. HABITS ────────────────────────────────────────────────────────────────

create table if not exists public.habits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  name             text not null,
  description      text,
  icon             text not null default '✅',
  color            text not null default '#2552ca',
  frequency        text not null default 'daily' check (frequency in ('daily','weekly','custom')),
  frequency_days   integer[] default '{}',   -- 0=Sun..6=Sat for weekly
  reminder_time    time,
  category         text default 'general',
  current_streak   integer not null default 0,
  longest_streak   integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id           uuid primary key default gen_random_uuid(),
  habit_id     uuid not null references public.habits(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  log_date     date not null,
  completed_at timestamptz not null default now(),
  unique(habit_id, log_date)
);

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

create policy "habits: owner all"
  on public.habits for all
  using (user_id = auth.uid());

create policy "habit_logs: owner all"
  on public.habit_logs for all
  using (user_id = auth.uid());

create index if not exists habits_user_id_idx on public.habits(user_id);
create index if not exists habit_logs_habit_id_date_idx on public.habit_logs(habit_id, log_date desc);


-- ── 4. FOCUS SESSIONS ────────────────────────────────────────────────────────

create table if not exists public.focus_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  plan_id          uuid references public.plans(id) on delete set null,
  session_type     text not null default 'pomodoro'
                     check (session_type in ('pomodoro','short_break','long_break','deep_work')),
  duration_minutes integer not null default 25,
  actual_minutes   integer,
  goal             text,
  notes            text,
  status           text not null default 'active' check (status in ('active','completed','abandoned')),
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.focus_sessions enable row level security;

create policy "focus_sessions: owner all"
  on public.focus_sessions for all
  using (user_id = auth.uid());

create index if not exists focus_sessions_user_id_idx on public.focus_sessions(user_id);
create index if not exists focus_sessions_started_at_idx on public.focus_sessions(started_at desc);


-- ── 5. DOCUMENTS ─────────────────────────────────────────────────────────────

create table if not exists public.documents (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  title                 text not null,
  content               text,
  word_count            integer,
  language              text default 'ar',
  summary               text,
  key_points            text[] default '{}',
  main_topics           text[] default '{}',
  sentiment             text default 'neutral',
  reading_time_minutes  integer,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "documents: owner all"
  on public.documents for all
  using (user_id = auth.uid());

create index if not exists documents_user_id_idx on public.documents(user_id);
create index if not exists documents_created_at_idx on public.documents(created_at desc);


-- ── 6. UPGRADE: Add meeting_recorded to timeline source_type ─────────────────

alter table public.timeline_events
  drop constraint if exists timeline_events_source_type_check;

alter table public.timeline_events
  add constraint timeline_events_source_type_check
    check (source_type in (
      'plan_created','plan_completed','memory_saved',
      'file_uploaded','voice_recorded','fact_learned',
      'meeting_recorded','focus_completed','goal_completed','habit_streak'
    ));


-- ── 7. UPGRADE: Add paddle_customer_id to profiles ───────────────────────────

alter table public.profiles
  add column if not exists paddle_customer_id text;

-- Upgrade plan_tier to support new tiers
alter table public.profiles
  drop constraint if exists profiles_plan_tier_check;

alter table public.profiles
  add constraint profiles_plan_tier_check
    check (plan_tier in ('FREE','PRO','TEAMS','INDIVIDUAL','COMPANY'));


-- ── 8. UPGRADE: Add plan_tier to subscriptions ───────────────────────────────

alter table public.subscriptions
  add column if not exists plan_tier text default 'FREE';

alter table public.subscriptions
  add column if not exists billing_cycle text check (billing_cycle in ('monthly','annual'));

alter table public.subscriptions
  add column if not exists paddle_subscription_id text;

alter table public.subscriptions
  add column if not exists paddle_customer_id text;

alter table public.subscriptions
  add column if not exists next_billing_date timestamptz;

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean default false;

-- ================================================================
-- Done. Run fix_rls_recursion.sql if you haven't already.
-- ================================================================
