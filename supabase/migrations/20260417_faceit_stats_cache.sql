-- Cache de estatísticas lifetime da API FACEIT no perfil do jogador.
-- Evita chamadas repetidas à API para N usuários simultâneos —
-- o ranking lê apenas do Supabase (ISR no Next.js) e o sync ocorre
-- em background com controle de freshness via faceit_stats_synced_at.

alter table public.profiles
  add column if not exists faceit_kd_ratio    float,
  add column if not exists faceit_win_streak  integer,
  add column if not exists faceit_matches     integer,
  add column if not exists faceit_win_rate    integer,
  add column if not exists faceit_stats_synced_at timestamptz;

-- Índice para a query do ranking FACEIT (ordena por ELO desc, filtra por faceit_id not null)
create index if not exists idx_profiles_faceit_ranking
  on public.profiles (faceit_elo desc nulls last)
  where faceit_id is not null and faceit_elo is not null;
