create table if not exists public.health_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  date         date not null,
  water_cups   int not null default 0,
  steps        int not null default 0,
  sleep_hours  numeric(3,1) not null default 0,
  created_at   timestamptz not null default now(),
  unique(user_id, date)
);

alter table public.health_logs enable row level security;

create policy "Users manage own health logs"
  on public.health_logs
  for all using (auth.uid() = user_id);

create table if not exists public.health_nudge_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  phone      text not null,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.health_nudge_subscriptions enable row level security;

create policy "Users manage own health nudge subscriptions"
  on public.health_nudge_subscriptions
  for all using (auth.uid() = user_id);
