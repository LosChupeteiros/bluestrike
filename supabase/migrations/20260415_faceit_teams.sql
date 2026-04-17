-- Armazena os IDs dos times CS2 Faceit do jogador (sincronizado a cada carregamento de perfil)
alter table public.profiles
  add column if not exists faceit_team_ids text[];
