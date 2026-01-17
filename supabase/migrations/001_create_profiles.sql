-- Table profiles liée à auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index pour recherche rapide par username
create index if not exists profiles_username_idx on public.profiles (username);

-- Fonction pour mettre à jour updated_at automatiquement
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger updated_at
drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;

-- Policies
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Fonction pour vérifier si un username est disponible (appelable depuis le client)
create or replace function public.is_username_available(check_username text)
returns boolean as $$
begin
  return not exists (
    select 1 from public.profiles where lower(username) = lower(check_username)
  );
end;
$$ language plpgsql security definer;
