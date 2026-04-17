-- Taxa de inscrição por campeonato (gerenciada pelo admin junto com a prize pool)
alter table public.faceit_prizes
  add column if not exists entry_fee numeric not null default 0;

-- Inscrições BlueStrike para campeonatos FACEIT
-- Rastreia cada time inscrito via BlueStrike: pagamento, amizade e confirmação na FACEIT
create table if not exists public.faceit_registrations (
  id                 uuid        primary key default gen_random_uuid(),
  championship_id    text        not null,
  profile_id         uuid        not null references public.profiles(id) on delete cascade,
  faceit_team_id     text        not null,
  faceit_team_name   text        not null,
  faceit_team_avatar text,
  payment_status     text        not null default 'pending',  -- 'pending' | 'paid'
  friend_check       boolean     not null default false,      -- capitão adicionou BlueStrikeCS?
  team_confirmed     boolean     not null default false,      -- time aparece nas inscrições FACEIT?
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (championship_id, profile_id)
);
