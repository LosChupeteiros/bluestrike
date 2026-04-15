create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  public_id bigint,
  steam_id text not null unique,
  steam_persona_name text not null,
  steam_avatar_url text,
  steam_profile_url text,
  steam_level integer not null default 0,
  elo integer not null default 1000,
  full_name text,
  cpf text unique,
  phone text,
  birth_date date,
  bio text,
  in_game_role text,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists public_id bigint;
alter table public.profiles add column if not exists steam_id text;
alter table public.profiles add column if not exists steam_persona_name text;
alter table public.profiles add column if not exists steam_avatar_url text;
alter table public.profiles add column if not exists steam_profile_url text;
alter table public.profiles add column if not exists steam_level integer not null default 0;
alter table public.profiles add column if not exists elo integer not null default 1000;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists cpf text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists in_game_role text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.profiles add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.profiles set steam_level = 0 where steam_level is null;
update public.profiles set elo = 1000 where elo is null;

alter table public.profiles alter column steam_level set default 0;
alter table public.profiles alter column steam_level set not null;
alter table public.profiles alter column elo set default 1000;
alter table public.profiles alter column elo set not null;
alter table public.profiles alter column is_admin set default false;
alter table public.profiles alter column is_admin set not null;
alter table public.profiles alter column created_at set default timezone('utc', now());
alter table public.profiles alter column created_at set not null;
alter table public.profiles alter column updated_at set default timezone('utc', now());
alter table public.profiles alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_class
    where relkind = 'S'
      and relnamespace = 'public'::regnamespace
      and relname = 'profiles_public_id_seq'
  ) then
    create sequence public.profiles_public_id_seq;
  end if;
end;
$$;

alter sequence public.profiles_public_id_seq owned by public.profiles.public_id;
alter table public.profiles alter column public_id set default nextval('public.profiles_public_id_seq');

update public.profiles
set public_id = nextval('public.profiles_public_id_seq')
where public_id is null;

select setval(
  'public.profiles_public_id_seq',
  coalesce((select max(public_id) from public.profiles), 0),
  true
);

alter table public.profiles alter column public_id set not null;

create unique index if not exists profiles_public_id_key on public.profiles (public_id);
create unique index if not exists profiles_steam_id_key on public.profiles (steam_id);
create unique index if not exists profiles_cpf_key on public.profiles (cpf) where cpf is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_in_game_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_in_game_role_check
      check (
        in_game_role in (
          'awper',
          'igl',
          'entry-fragger',
          'rifler',
          'lurker',
          'support',
          'coach'
        )
      );
  end if;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
