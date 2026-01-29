-- Thakirni Database Schema
-- Plans/Reminders table for storing user plans with AI-extracted details

-- Profiles table (references auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'premium')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- Auto-create profile trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Plans/Reminders table
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  original_text text, -- The original text user typed/spoke
  reminder_date timestamp with time zone,
  reminder_time time,
  is_recurring boolean default false,
  recurrence_pattern text, -- 'daily', 'weekly', 'monthly', 'yearly'
  category text default 'general', -- 'meeting', 'deadline', 'event', 'task', 'general'
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  is_completed boolean default false,
  reminder_sent boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.plans enable row level security;

create policy "plans_select_own" on public.plans for select using (auth.uid() = user_id);
create policy "plans_insert_own" on public.plans for insert with check (auth.uid() = user_id);
create policy "plans_update_own" on public.plans for update using (auth.uid() = user_id);
create policy "plans_delete_own" on public.plans for delete using (auth.uid() = user_id);

-- Chat history for AI conversations
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default now()
);

alter table public.chat_messages enable row level security;

create policy "chat_select_own" on public.chat_messages for select using (auth.uid() = user_id);
create policy "chat_insert_own" on public.chat_messages for insert with check (auth.uid() = user_id);
create policy "chat_delete_own" on public.chat_messages for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists plans_user_id_idx on public.plans(user_id);
create index if not exists plans_reminder_date_idx on public.plans(reminder_date);
create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);
