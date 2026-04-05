-- ============================================================
-- Viral Growth Systems
-- Referral reward upgrade, invite tracking, university codes
-- ============================================================

-- 1. Upgrade referral reward: +20 → +50 credits
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

  -- Reward BOTH with 50 credits each (up from 20)
  update profiles set ai_credits = coalesce(ai_credits, 0) + 50 where id = v_referrer_id;
  update profiles set ai_credits = coalesce(ai_credits, 0) + 50 where id = p_referred_id;

  -- Mark reward given
  update referrals set reward_given = true
  where referrer_id = v_referrer_id and referred_id = p_referred_id;
end;
$$;

-- 2. Track invite stats on referrals
alter table referrals
  add column if not exists invites_sent      integer not null default 0,
  add column if not exists invites_converted integer not null default 0;

-- 3. B2B upsell nudge dedup: reuse nudge_log with type 'b2b_upsell'
-- nudge_log already exists from activation_retention migration

-- 4. Seed university discount codes (30% off for students)
insert into discount_codes (code, discount_percent, max_uses, is_active, plan_key)
values
  ('KFUPM30',  30, 500,  true, 'pro'),
  ('IMAMU30',  30, 500,  true, 'pro'),
  ('PNU30',    30, 500,  true, 'pro'),
  ('KSU30',    30, 500,  true, 'pro'),
  ('KAUST30',  30, 200,  true, 'pro'),
  ('EFFAT30',  30, 200,  true, 'pro'),
  -- Launch promo codes
  ('LAUNCH50', 50, 1000, true, 'pro'),
  ('KHOBAR25', 25, 500,  true, 'pro')
on conflict (code) do nothing;

-- 5. Add viral_cta_count to profiles for lightweight tracking
alter table profiles
  add column if not exists viral_cta_sent_count integer not null default 0;

-- 6. Index to efficiently find workspaces needing B2B upsell
create index if not exists idx_workspace_members_ws
  on workspace_members(workspace_id);

-- 7. Helper RPC to safely increment viral_cta_sent_count
create or replace function increment_viral_cta_count(p_user_id uuid)
returns void language sql security definer as $$
  update profiles
  set viral_cta_sent_count = coalesce(viral_cta_sent_count, 0) + 1
  where id = p_user_id;
$$;
