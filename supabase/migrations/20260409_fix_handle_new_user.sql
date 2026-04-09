-- Fix handle_new_user trigger to persist phone_number and preferred_language from signup metadata

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_phone text := nullif(trim(coalesce(new.raw_user_meta_data->>'phone_number', '')), '');
  v_lang  text := coalesce(new.raw_user_meta_data->>'preferred_language', 'ar');
begin
  begin
    insert into public.profiles (id, full_name, avatar_url, preferred_language, phone_number)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'avatar_url',
      v_lang,
      v_phone
    )
    on conflict (id) do nothing;
  exception when unique_violation then
    -- Phone number already belongs to another account — insert without it
    insert into public.profiles (id, full_name, avatar_url, preferred_language)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'avatar_url',
      v_lang
    )
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;
