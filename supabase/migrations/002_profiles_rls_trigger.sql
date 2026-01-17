-- RLS + trigger for profiles creation
alter table public.profiles enable row level security;

-- Drop legacy policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Profiles are viewable by owner" on public.profiles;
drop policy if exists "Profiles can insert own profile" on public.profiles;
drop policy if exists "Profiles can update own profile" on public.profiles;

-- Policies: self-only access
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Profiles can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Profiles can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Create profile automatically on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      'user_' || left(new.id::text, 8)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Username availability check (RLS-safe)
create or replace function public.is_username_available(check_username text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return not exists (
    select 1 from public.profiles where lower(username) = lower(check_username)
  );
end;
$$;
