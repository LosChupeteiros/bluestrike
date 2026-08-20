-- Formato do time: um time de 1x1 nao e o mesmo time de 5x5.
-- O jogador pode ter um time por formato (o limite por jogador continua em teams.ts).
-- Default 5 mantem todos os times existentes como 5x5.
alter table public.teams
  add column if not exists team_size smallint not null default 5;

alter table public.teams
  drop constraint if exists teams_team_size_check;

alter table public.teams
  add constraint teams_team_size_check
  check (team_size between 1 and 5);

comment on column public.teams.team_size is
  'Formato do time (1 = 1x1 ... 5 = 5x5). Define titulares minimos e em quais campeonatos o time pode se inscrever.';

create index if not exists teams_team_size_idx on public.teams (team_size) where is_active;
