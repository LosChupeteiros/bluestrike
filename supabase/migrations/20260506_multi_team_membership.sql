-- Permite que um jogador faça parte de até 8 times simultaneamente.
-- Remove o índice único que bloqueava mais de um time por jogador.
drop index if exists public.team_members_one_active_team;

-- Snapshot dos jogadores selecionados pelo capitão no momento da intent
alter table public.tournament_registration_intents
  add column if not exists roster_profile_ids uuid[] not null default '{}';

-- Snapshot imutável dos jogadores confirmados na inscrição final
alter table public.tournament_registrations
  add column if not exists roster_profile_ids uuid[] not null default '{}';
