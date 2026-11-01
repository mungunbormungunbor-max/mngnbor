-- my-account: user profiles, privacy rules, and account deletion.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run again (everything is "if not exists" / "or replace").
--
-- Every registered user already has a unique ID: `auth.users.id` (a UUID) that Supabase Auth creates at
-- signup. `profiles.id` is that same ID, so one account = one profile = one ID, and rows can never be shared.

-- 1. Profiles ---------------------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2. Privacy: row level security ----------------------------------------------------------------------
-- With RLS on and no policy for a role, that role sees nothing. Each policy below only matches the row
-- whose id equals the signed-in user's own ID, so users cannot read or change anyone else's profile.
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: insert own"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No delete policy on purpose: a profile is removed only together with its account (on delete cascade).
-- Signed-out visitors (role `anon`) have no policy, so they can read and write nothing.

-- 3. Keep updated_at fresh ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. Create a profile automatically when someone registers ------------------------------------------
-- The signup form sends the name as user metadata `display_name`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 60))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- This function is only for the trigger; nobody should be able to call it through the API.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Give accounts that were created before this script ran a profile too.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- 5. Delete my account ----------------------------------------------------------------------------------
-- A browser can't delete its own auth user directly, so the account page calls this function.
-- It can only ever delete the caller (auth.uid()), never another user. Deleting the auth user cascades
-- to the profile, and to any table that references auth.users(id) with `on delete cascade`.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
