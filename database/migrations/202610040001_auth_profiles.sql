-- GULU TOURNEX authentication profiles and globally unique player usernames.
-- Run this migration once in the Supabase SQL Editor for your project.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null or (
      username = lower(username)
      and username ~ '^[a-z0-9_]{3,20}$'
      and username not in (
        'admin', 'administrator', 'api', 'gulu', 'gulutournex',
        'help', 'leaderboard', 'login', 'null', 'profile',
        'search', 'settings', 'signup', 'support', 'tournaments',
        'undefined', 'www', 'winners'
      )
    )
  )
);

create unique index if not exists profiles_username_unique
  on public.profiles (username)
  where username is not null;

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "Players can read their own profile" on public.profiles;
create policy "Players can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Also add profiles for any Auth users that existed before this migration ran.
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), '')
  ),
  nullif(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users as u
on conflict (id) do nothing;

create or replace function public.username_is_available(candidate_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and lower(btrim(coalesce(candidate_username, ''))) ~ '^[a-z0-9_]{3,20}$'
    and lower(btrim(coalesce(candidate_username, ''))) not in (
      'admin', 'administrator', 'api', 'gulu', 'gulutournex',
      'help', 'leaderboard', 'login', 'null', 'profile',
      'search', 'settings', 'signup', 'support', 'tournaments',
      'undefined', 'www', 'winners'
    )
    and not exists (
      select 1
      from public.profiles as p
      where p.username = lower(btrim(coalesce(candidate_username, '')))
    );
$$;

revoke all on function public.username_is_available(text) from public, anon;
grant execute on function public.username_is_available(text) to authenticated;

create or replace function public.claim_username(candidate_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_username text := lower(btrim(coalesce(candidate_username, '')));
  existing_username text;
begin
  if current_user_id is null then
    raise exception using errcode = '28000', message = 'not_authenticated';
  end if;

  if normalized_username !~ '^[a-z0-9_]{3,20}$'
     or normalized_username in (
       'admin', 'administrator', 'api', 'gulu', 'gulutournex',
       'help', 'leaderboard', 'login', 'null', 'profile',
       'search', 'settings', 'signup', 'support', 'tournaments',
       'undefined', 'www', 'winners'
     ) then
    raise exception using errcode = '22023', message = 'username_invalid';
  end if;

  update public.profiles
  set username = normalized_username
  where id = current_user_id
    and username is null;

  if found then
    return normalized_username;
  end if;

  select p.username
  into existing_username
  from public.profiles as p
  where p.id = current_user_id;

  if existing_username = normalized_username then
    return existing_username;
  end if;

  if exists (
    select 1 from public.profiles as p
    where p.username = normalized_username
  ) then
    raise exception using errcode = '23505', message = 'username_taken';
  end if;

  raise exception using errcode = 'P0001', message = 'username_already_set';
end;
$$;

revoke all on function public.claim_username(text) from public, anon;
grant execute on function public.claim_username(text) to authenticated;

