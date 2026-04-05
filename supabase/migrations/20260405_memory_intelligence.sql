-- ============================================================
-- Memory Intelligence System
-- Persistent user memory, city profile, ab_experiments
-- ============================================================

-- 1. Add city to profiles (location-aware intelligence)
alter table profiles
  add column if not exists city text,
  add column if not exists is_admin boolean not null default false;

-- 2. user_memory — persistent key-value memory per user
create table if not exists user_memory (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references profiles(id) on delete cascade,
  workspace_id uuid        references workspaces(id) on delete cascade,
  key          text        not null,
  value        jsonb       not null default '{}',
  category     text        not null
                           check (category in ('people','preferences','routines','important_dates')),
  confidence   numeric(3,2) not null default 0.85
                            check (confidence >= 0 and confidence <= 1),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists idx_user_memory_user    on user_memory(user_id);
create index if not exists idx_user_memory_ws      on user_memory(workspace_id);
create index if not exists idx_user_memory_cat     on user_memory(user_id, category);

alter table user_memory enable row level security;

create policy "user_memory_own_select"
  on user_memory for select
  using (auth.uid() = user_id);

create policy "user_memory_own_insert"
  on user_memory for insert
  with check (auth.uid() = user_id);

create policy "user_memory_own_update"
  on user_memory for update
  using (auth.uid() = user_id);

create policy "user_memory_own_delete"
  on user_memory for delete
  using (auth.uid() = user_id);

-- 3. predictive_insights — cached AI predictions per user
create table if not exists predictive_insights (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references profiles(id) on delete cascade,
  insight_type text        not null
                           check (insight_type in ('delayed_task','gym_skip','inactivity','upgrade_prompt','overdue_batch')),
  payload      jsonb       not null default '{}',
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists idx_predictive_user  on predictive_insights(user_id, created_at desc);
create index if not exists idx_predictive_sent  on predictive_insights(user_id, sent_at);

alter table predictive_insights enable row level security;

-- 4. Auto-update updated_at on user_memory
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_memory_updated_at on user_memory;
create trigger trg_user_memory_updated_at
  before update on user_memory
  for each row execute function set_updated_at();

-- 5. Add experiment_group to feature_flags for A/B testing
alter table feature_flags
  add column if not exists experiment_group text default null,
  add column if not exists variant_a        text default null,
  add column if not exists variant_b        text default null;

-- 6. Seed default experiment flags
insert into feature_flags (key, enabled, rollout_percentage, experiment_group, variant_a, variant_b)
values
  ('exp_onboarding_tone',   true, 50, 'onboarding',     'formal',    'casual'),
  ('exp_upgrade_message',   true, 50, 'monetization',   'soft',      'direct'),
  ('exp_morning_briefing',  true, 50, 'retention',      'minimal',   'detailed')
on conflict (key) do nothing;
