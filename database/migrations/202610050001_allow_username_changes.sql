-- Allow authenticated players to update their username while keeping the existing
-- global unique index as the source of truth. Released usernames may be claimed
-- by another player after a change.

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
        and p.id <> (select auth.uid())
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
  where id = current_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'profile_missing';
  end if;

  return normalized_username;
end;
$$;

revoke all on function public.claim_username(text) from public, anon;
grant execute on function public.claim_username(text) to authenticated;