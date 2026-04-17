-- Faceit integration: store linked Faceit account data on the profile
alter table public.profiles
  add column if not exists faceit_id       text unique,
  add column if not exists faceit_nickname text,
  add column if not exists faceit_avatar   text,
  add column if not exists faceit_elo      integer,
  add column if not exists faceit_level    integer;
