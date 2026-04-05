-- ============================================================
-- Activation & Retention Systems
-- Tracks granular onboarding steps + day-1 nudge deduplication
-- ============================================================

-- 1. onboarding_progress — tracks per-user activation milestones
create table if not exists onboarding_progress (
  user_id              uuid   primary key references profiles(id) on delete cascade,
  created_first_task   boolean not null default false,
  used_ai_once         boolean not null default false,
  completed_action     boolean not null default false,
  connected_whatsapp   boolean not null default false,
  saw_first_value      boolean not null default false,   -- saw auto-created item in onboarding
  selected_use_cases   text[]  not null default '{}',
  completed_at         timestamptz,                       -- null until fully activated
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_onboarding_completed on onboarding_progress(completed_at)
  where completed_at is not null;

alter table onboarding_progress enable row level security;

create policy "onboarding_own_select"
  on onboarding_progress for select
  using (auth.uid() = user_id);

create policy "onboarding_own_upsert"
  on onboarding_progress for insert
  with check (auth.uid() = user_id);

create policy "onboarding_own_update"
  on onboarding_progress for update
  using (auth.uid() = user_id);

-- 2. nudge_log — prevent duplicate nudges per user per type per day
create table if not exists nudge_log (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  nudge_type  text        not null,   -- 'day1_checkin', 'day1_inactive', 'evening_reflection', 'anti_churn', etc.
  sent_at     timestamptz not null default now(),
  channel     text        not null default 'whatsapp'
);

create index if not exists idx_nudge_log_user_type on nudge_log(user_id, nudge_type, sent_at desc);

alter table nudge_log enable row level security;
-- Service role only reads nudge_log (no user-facing reads needed)

-- 3. Auto-update updated_at on onboarding_progress (reuse set_updated_at if exists)
drop trigger if exists trg_onboarding_progress_updated_at on onboarding_progress;
create trigger trg_onboarding_progress_updated_at
  before update on onboarding_progress
  for each row execute function set_updated_at();

-- 4. Function: mark a single onboarding milestone
create or replace function mark_onboarding_step(
  p_user_id uuid,
  p_step    text   -- 'created_first_task' | 'used_ai_once' | 'completed_action' | 'connected_whatsapp' | 'saw_first_value'
)
returns void language plpgsql security definer
set search_path = public as $$
begin
  insert into onboarding_progress (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  case p_step
    when 'created_first_task'  then update onboarding_progress set created_first_task  = true, updated_at = now() where user_id = p_user_id;
    when 'used_ai_once'        then update onboarding_progress set used_ai_once        = true, updated_at = now() where user_id = p_user_id;
    when 'completed_action'    then update onboarding_progress set completed_action    = true, updated_at = now() where user_id = p_user_id;
    when 'connected_whatsapp'  then update onboarding_progress set connected_whatsapp  = true, updated_at = now() where user_id = p_user_id;
    when 'saw_first_value'     then update onboarding_progress set saw_first_value     = true, updated_at = now() where user_id = p_user_id;
    else null;
  end case;

  -- Auto-mark completed when ≥ 2 milestones hit
  update onboarding_progress
  set completed_at = now()
  where user_id = p_user_id
    and completed_at is null
    and (
      (created_first_task::int + used_ai_once::int + completed_action::int + connected_whatsapp::int) >= 2
    );

  -- Also fire the existing is_activated check
  perform check_activation(p_user_id);
end;
$$;
