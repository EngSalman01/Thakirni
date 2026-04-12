create table if not exists public.prayer_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  phone      text not null,
  prayers    text[] not null default '{fajr,dhuhr,asr,maghrib,isha}',
  city       text not null default 'Riyadh',
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.prayer_subscriptions enable row level security;

create unique index if not exists prayer_subscriptions_user_id_key
  on public.prayer_subscriptions (user_id);

create policy "Users manage own prayer subscriptions"
  on public.prayer_subscriptions
  for all using (auth.uid() = user_id);
