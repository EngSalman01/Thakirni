-- ============================================================
-- Addiction Loop & WhatsApp Auto-Welcome
-- ============================================================

-- 1. Track whether the onboarding WhatsApp welcome was sent
alter table profiles
  add column if not exists whatsapp_welcomed boolean not null default false;

-- 2. Daily completion streak (consecutive days with ≥1 done plan)
alter table profiles
  add column if not exists daily_streak integer not null default 0;

-- 3. Mark welcome sent (called from API route)
create or replace function mark_whatsapp_welcomed(p_user_id uuid)
returns void language sql security definer as $$
  update profiles set whatsapp_welcomed = true where id = p_user_id;
$$;

-- 4. Compute and update daily_streak for a user
-- A streak day = any calendar day (Riyadh tz) with ≥1 done plan
create or replace function refresh_daily_streak(p_user_id uuid)
returns integer language plpgsql security definer as $$
declare
  v_streak integer := 0;
  v_date   date;
  v_check  date;
begin
  -- Start from yesterday and walk backwards
  v_check := (current_timestamp at time zone 'Asia/Riyadh')::date - 1;

  -- If today has done plans, include today in the streak
  if exists (
    select 1 from plans
    where user_id = p_user_id
      and status = 'done'
      and plan_date = (current_timestamp at time zone 'Asia/Riyadh')::date
  ) then
    v_streak := 1;
    v_check  := v_check; -- still check yesterday
  end if;

  -- Walk back while each day has a done plan
  loop
    if not exists (
      select 1 from plans
      where user_id = p_user_id
        and status = 'done'
        and plan_date = v_check
    ) then
      exit;
    end if;
    v_streak := v_streak + 1;
    v_check  := v_check - 1;
  end loop;

  update profiles set daily_streak = v_streak where id = p_user_id;
  return v_streak;
end;
$$;

-- 5. Index for fast streak queries
create index if not exists idx_plans_user_date_status
  on plans(user_id, plan_date, status);
