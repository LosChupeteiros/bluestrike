-- =============================================================================
-- BlueStrike — Migration: match scheduling, ready-up, veto, server provisioning
-- =============================================================================

-- Ready state for both captains (both must be true before match starts)
alter table public.matches
  add column if not exists ready_team1 boolean not null default false;

alter table public.matches
  add column if not exists ready_team2 boolean not null default false;

-- Set when both team1_id and team2_id are assigned. Starts the 1h soft deadline window.
-- After 1h teams are subject to penalty, but nothing is blocked.
alter table public.matches
  add column if not exists teams_assigned_at timestamptz;

-- Raw IP + password stored after server provisioning
alter table public.dathost_servers
  add column if not exists raw_ip text;

alter table public.dathost_servers
  add column if not exists server_password text;

-- Map veto table (may already exist — safe to run)
create table if not exists public.map_vetoes (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  action      text not null check (action in ('ban', 'pick')),
  map_name    text not null,
  veto_order  integer not null,
  picked_side text check (picked_side in ('ct', 't')),
  created_at  timestamptz not null default now()
);

create index if not exists map_vetoes_match_idx on public.map_vetoes (match_id, veto_order);
