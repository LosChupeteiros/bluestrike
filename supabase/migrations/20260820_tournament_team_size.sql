-- Formato de disputa do campeonato: 1x1 ate 5x5.
-- Default 5 mantem todos os campeonatos existentes como 5x5.
alter table public.tournaments
  add column if not exists team_size smallint not null default 5;

alter table public.tournaments
  drop constraint if exists tournaments_team_size_check;

alter table public.tournaments
  add constraint tournaments_team_size_check
  check (team_size between 1 and 5);

comment on column public.tournaments.team_size is
  'Jogadores por time em quadra (1 = 1x1 ... 5 = 5x5). Define o tamanho minimo do roster na inscricao.';
