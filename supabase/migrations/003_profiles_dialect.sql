alter table public.profiles
  add column if not exists dialect text not null default 'khobar';
