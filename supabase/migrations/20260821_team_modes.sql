-- =============================================================================
-- BlueStrike — Modalidades 1x1, 2x2, 3x3, 4x4 e 5x5
-- =============================================================================
-- Um jogador pode ter vários times (já liberado em 20260506_multi_team_membership),
-- porém agora cada time pertence a uma modalidade. Campeonatos só aceitam times
-- da mesma modalidade e as partidas herdam o modo do campeonato.

-- ── TEAMS ────────────────────────────────────────────────────────────────────

alter table public.teams
  add column if not exists team_mode text not null default '5v5';

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'teams_team_mode_check' and conrelid = 'public.teams'::regclass
  ) then
    alter table public.teams
      add constraint teams_team_mode_check
      check (team_mode in ('1v1','2v2','3v3','4v4','5v5'));
  end if;
end; $$;

create index if not exists teams_team_mode_idx on public.teams (team_mode, is_active);

-- Nome e tag passam a ser únicos por modalidade: o mesmo capitão pode ter
-- "Los Chupeteiros" no 5x5 e no 2x2 sem colisão.

-- ── TOURNAMENTS ──────────────────────────────────────────────────────────────

alter table public.tournaments
  add column if not exists team_mode text not null default '5v5';

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tournaments_team_mode_check' and conrelid = 'public.tournaments'::regclass
  ) then
    alter table public.tournaments
      add constraint tournaments_team_mode_check
      check (team_mode in ('1v1','2v2','3v3','4v4','5v5'));
  end if;
end; $$;

create index if not exists tournaments_team_mode_idx on public.tournaments (team_mode, status);

-- ── MATCHES ──────────────────────────────────────────────────────────────────
-- Denormalizado a partir do campeonato para evitar join nos fluxos de veto,
-- provisionamento de servidor e geração do config do MatchZy.

alter table public.matches
  add column if not exists team_mode text not null default '5v5';

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'matches_team_mode_check' and conrelid = 'public.matches'::regclass
  ) then
    alter table public.matches
      add constraint matches_team_mode_check
      check (team_mode in ('1v1','2v2','3v3','4v4','5v5'));
  end if;
end; $$;

-- Backfill de partidas já existentes
update public.matches m
   set team_mode = t.team_mode
  from public.tournaments t
 where m.tournament_id = t.id
   and m.team_mode is distinct from t.team_mode;
