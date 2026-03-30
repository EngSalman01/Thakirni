-- ============================================================
-- Growth systems: onboarding, referrals, analytics_events, activation
-- ============================================================

-- 1. Add onboarding + activation columns to profiles
alter table profiles
  add column if not exists onboarded_at  timestamptz,
  add column if not exists is_activated  boolean not null default false,
  add column if not exists referral_code text unique;

-- Generate a unique referral code for every existing user
update profiles
set referral_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where referral_code is null;

-- Auto-generate referral code for new users
create or replace function generate_referral_code()
returns trigger language plpgsql as $$
begin
  new.referral_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  return new;
end;
$$;

drop trigger if exists trg_generate_referral_code on profiles;
create trigger trg_generate_referral_code
  before insert on profiles
  for each row
  when (new.referral_code is null)
  execute function generate_referral_code();

-- 2. Referrals table
create table if not exists referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     uuid not null references profiles(id) on delete cascade,
  referred_id     uuid not null references profiles(id) on delete cascade,
  reward_given    boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (referred_id)  -- each user can only be referred once
);

create index if not exists idx_referrals_referrer on referrals(referrer_id);

-- RLS
alter table referrals enable row level security;

create policy "Users can view their own referrals"
  on referrals for select
  using (referrer_id = auth.uid());

-- 3. Analytics events table
create table if not exists analytics_events (
  id          bigint generated always as identity primary key,
  user_id     uuid references profiles(id) on delete set null,
  event_name  text not null,
  properties  jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists idx_analytics_events_user    on analytics_events(user_id);
create index if not exists idx_analytics_events_name    on analytics_events(event_name);
create index if not exists idx_analytics_events_created on analytics_events(created_at desc);

-- RLS: users can only see their own events; service role can see all
alter table analytics_events enable row level security;

create policy "Users can view their own events"
  on analytics_events for select
  using (user_id = auth.uid());

create policy "Service role can insert events"
  on analytics_events for insert
  with check (true);

-- 4. Function to check + mark user as activated
create or replace function check_activation(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_projects   int;
  v_ai_use     int;
  v_items      int;
  v_whatsapp   int;
begin
  -- already activated
  if exists (select 1 from profiles where id = p_user_id and is_activated = true) then
    return;
  end if;

  select count(*) into v_projects from projects where user_id = p_user_id limit 1;
  select count(*) into v_ai_use   from analytics_events where user_id = p_user_id and event_name = 'ai_chat_sent' limit 1;
  select count(*) into v_items    from memories where user_id = p_user_id limit 1;
  select count(*) into v_whatsapp from analytics_events where user_id = p_user_id and event_name = 'whatsapp_welcome_sent' limit 1;

  if (v_projects >= 1 and v_ai_use >= 1 and v_items >= 1) or v_whatsapp >= 1 then
    update profiles set is_activated = true where id = p_user_id;
  end if;
end;
$$;

-- 5. Function to handle referral signup reward
create or replace function apply_referral_reward(p_referred_id uuid, p_referral_code text)
returns void language plpgsql security definer as $$
declare
  v_referrer_id uuid;
begin
  select id into v_referrer_id
  from profiles
  where referral_code = upper(p_referral_code)
    and id != p_referred_id;

  if v_referrer_id is null then return; end if;

  -- Record referral
  insert into referrals (referrer_id, referred_id)
  values (v_referrer_id, p_referred_id)
  on conflict (referred_id) do nothing;

  -- Reward both users with 20 credits each
  update profiles set ai_credits = coalesce(ai_credits, 0) + 20 where id = v_referrer_id;
  update profiles set ai_credits = coalesce(ai_credits, 0) + 20 where id = p_referred_id;

  -- Mark reward given
  update referrals set reward_given = true
  where referrer_id = v_referrer_id and referred_id = p_referred_id;
end;
$$;
