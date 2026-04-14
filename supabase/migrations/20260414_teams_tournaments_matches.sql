-- =============================================================================
-- BlueStrike — Migration 001
-- Teams, Tournaments, Matches, Stats, Notifications, Badges
-- =============================================================================

-- ---------------------------------------------------------------------------
-- UTILITY: função set_updated_at já existe em schema.sql; reutilizada abaixo.
-- ---------------------------------------------------------------------------

-- =============================================================================
-- TEAMS
-- =============================================================================

create table if not exists public.teams (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,           -- URL-friendly, ex: "blue-strike-prime"
  name            text not null,
  tag             text not null,                  -- máx 5 chars, uppercase
  description     text,
  logo_url        text,                           -- Supabase Storage: bucket team-assets
  banner_url      text,                           -- Supabase Storage: bucket team-assets
  join_code       text not null unique default replace(gen_random_uuid()::text, '-', ''),
  password_hash   text,                           -- bcrypt; NULL = sem senha
  captain_id      uuid not null references public.profiles(id) on delete restrict,
  is_recruiting   boolean not null default true,  -- aparece no catálogo como "vagas abertas"
  elo             integer not null default 1000,  -- ELO médio do time (recalculado a cada partida)
  wins            integer not null default 0,
  losses          integer not null default 0,
  is_active       boolean not null default true,  -- false = time dissolvido
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

alter table public.teams add column if not exists slug          text;
alter table public.teams add column if not exists name          text;
alter table public.teams add column if not exists tag           text;
alter table public.teams add column if not exists description   text;
alter table public.teams add column if not exists logo_url      text;
alter table public.teams add column if not exists banner_url    text;
alter table public.teams add column if not exists join_code     text;
alter table public.teams add column if not exists password_hash text;
alter table public.teams add column if not exists captain_id    uuid;
alter table public.teams add column if not exists is_recruiting boolean;
alter table public.teams add column if not exists elo           integer;
alter table public.teams add column if not exists wins          integer;
alter table public.teams add column if not exists losses        integer;
alter table public.teams add column if not exists is_active     boolean;
alter table public.teams add column if not exists created_at    timestamptz;
alter table public.teams add column if not exists updated_at    timestamptz;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'teams_tag_length_check' and conrelid = 'public.teams'::regclass
  ) then
    alter table public.teams
      add constraint teams_tag_length_check check (char_length(tag) between 2 and 5);
  end if;
end; $$;

create unique index if not exists teams_slug_key     on public.teams (slug);
create unique index if not exists teams_join_code_key on public.teams (join_code);
create index       if not exists teams_captain_idx   on public.teams (captain_id);
create index       if not exists teams_is_active_idx on public.teams (is_active, is_recruiting);

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
  before update on public.teams
  for each row execute procedure public.set_updated_at();

alter table public.teams enable row level security;

-- Policies para teams
drop policy if exists "teams_select_public"    on public.teams;
drop policy if exists "teams_insert_own"       on public.teams;
drop policy if exists "teams_update_captain"   on public.teams;
drop policy if exists "teams_delete_captain"   on public.teams;

-- Qualquer um pode ver times ativos (catálogo público)
create policy "teams_select_public" on public.teams
  for select using (is_active = true);

-- Inserção e mutações são feitas via service role (API routes) — anon não acessa
-- As políticas abaixo protegem acesso direto a qualquer chave não-service

-- =============================================================================
-- TEAM MEMBERS
-- =============================================================================

create table if not exists public.team_members (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  in_game_role  text check (in_game_role in ('awper','igl','entry-fragger','rifler','lurker','support','coach')),
  is_starter    boolean not null default true,   -- false = substituto
  joined_at     timestamptz not null default timezone('utc', now()),
  unique (team_id, profile_id)
);

alter table public.team_members add column if not exists team_id      uuid;
alter table public.team_members add column if not exists profile_id   uuid;
alter table public.team_members add column if not exists in_game_role text;
alter table public.team_members add column if not exists is_starter   boolean;
alter table public.team_members add column if not exists joined_at    timestamptz;

create index if not exists team_members_team_idx    on public.team_members (team_id);
create index if not exists team_members_profile_idx on public.team_members (profile_id);

-- Um jogador só pode estar em um time ativo ao mesmo tempo
-- Aplicado via check na API; também um índice parcial como segurança extra:
create unique index if not exists team_members_one_active_team
  on public.team_members (profile_id)
  where is_starter is not null;  -- esse índice é intencional: impede duplicatas de membro

alter table public.team_members enable row level security;

drop policy if exists "team_members_select_public" on public.team_members;
create policy "team_members_select_public" on public.team_members
  for select using (true);

-- =============================================================================
-- TOURNAMENTS
-- =============================================================================

create table if not exists public.tournaments (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  description           text,
  rules                 text[],
  prize_total           integer not null default 0,        -- valor em BRL inteiro
  prize_breakdown       jsonb,                             -- [{"place":"1º","amount":2500}, ...]
  banner_url            text,
  status                text not null default 'upcoming'
                          check (status in ('upcoming','open','ongoing','finished')),
  format                text not null default 'single_elimination'
                          check (format in ('single_elimination','double_elimination','round_robin','swiss')),
  max_teams             integer not null default 16,
  min_elo               integer,                           -- NULL = sem restrição
  max_elo               integer,
  check_in_required     boolean not null default true,
  check_in_window_mins  integer not null default 30,
  region                text not null default 'BR',
  organizer_id          uuid references public.profiles(id) on delete set null,
  organizer_name        text not null default 'BlueStrike',
  featured              boolean not null default false,
  tags                  text[],
  registration_starts   timestamptz,
  registration_ends     timestamptz,
  starts_at             timestamptz,
  ends_at               timestamptz,
  created_at            timestamptz not null default timezone('utc', now()),
  updated_at            timestamptz not null default timezone('utc', now())
);

create index if not exists tournaments_status_idx   on public.tournaments (status);
create index if not exists tournaments_featured_idx on public.tournaments (featured) where featured = true;
create index if not exists tournaments_starts_at_idx on public.tournaments (starts_at);

drop trigger if exists tournaments_set_updated_at on public.tournaments;
create trigger tournaments_set_updated_at
  before update on public.tournaments
  for each row execute procedure public.set_updated_at();

alter table public.tournaments enable row level security;

drop policy if exists "tournaments_select_public" on public.tournaments;
create policy "tournaments_select_public" on public.tournaments
  for select using (true);

-- =============================================================================
-- TOURNAMENT REGISTRATIONS
-- =============================================================================

create table if not exists public.tournament_registrations (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references public.tournaments(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','eliminated','champion','withdrawn')),
  checked_in      boolean not null default false,
  checked_in_at   timestamptz,
  registered_at   timestamptz not null default timezone('utc', now()),
  unique (tournament_id, team_id)
);

create index if not exists registrations_tournament_idx on public.tournament_registrations (tournament_id);
create index if not exists registrations_team_idx       on public.tournament_registrations (team_id);

alter table public.tournament_registrations enable row level security;

drop policy if exists "registrations_select_public" on public.tournament_registrations;
create policy "registrations_select_public" on public.tournament_registrations
  for select using (true);

-- =============================================================================
-- MATCHES
-- =============================================================================

create table if not exists public.matches (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid references public.tournaments(id) on delete cascade,
  registration1_id uuid references public.tournament_registrations(id) on delete set null,
  registration2_id uuid references public.tournament_registrations(id) on delete set null,
  team1_id         uuid references public.teams(id) on delete set null,
  team2_id         uuid references public.teams(id) on delete set null,
  round            integer not null default 1,
  bo_type          integer not null default 1 check (bo_type in (1,3,5)),  -- best of 1/3/5
  status           text not null default 'pending'
                     check (status in ('pending','veto','live','finished','cancelled','walkover')),
  winner_id        uuid references public.teams(id) on delete set null,
  scheduled_at     timestamptz,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_at       timestamptz not null default timezone('utc', now()),
  updated_at       timestamptz not null default timezone('utc', now())
);

create index if not exists matches_tournament_idx  on public.matches (tournament_id);
create index if not exists matches_status_idx      on public.matches (status);
create index if not exists matches_team1_idx       on public.matches (team1_id);
create index if not exists matches_team2_idx       on public.matches (team2_id);

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
  before update on public.matches
  for each row execute procedure public.set_updated_at();

alter table public.matches enable row level security;

drop policy if exists "matches_select_public" on public.matches;
create policy "matches_select_public" on public.matches
  for select using (true);

-- =============================================================================
-- MATCH MAPS  (cada mapa de um Bo3/Bo5 é uma row separada)
-- =============================================================================

create table if not exists public.match_maps (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  map_name    text not null,
  map_order   integer not null default 1,   -- 1ª mapa, 2ª mapa, etc.
  team1_score integer,
  team2_score integer,
  winner_id   uuid references public.teams(id) on delete set null,
  status      text not null default 'pending'
                check (status in ('pending','live','finished')),
  played_at   timestamptz,
  unique (match_id, map_order)
);

create index if not exists match_maps_match_idx on public.match_maps (match_id);

alter table public.match_maps enable row level security;

drop policy if exists "match_maps_select_public" on public.match_maps;
create policy "match_maps_select_public" on public.match_maps
  for select using (true);

-- =============================================================================
-- MATCH PLAYER STATS  (stats por jogador por mapa)
-- =============================================================================

create table if not exists public.match_player_stats (
  id          uuid primary key default gen_random_uuid(),
  match_map_id uuid not null references public.match_maps(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  kills       integer not null default 0,
  deaths      integer not null default 0,
  assists     integer not null default 0,
  hs_count    integer not null default 0,
  adr         numeric(6,2),    -- average damage per round
  rating      numeric(5,3),    -- HLTV-style rating
  unique (match_map_id, profile_id)
);

create index if not exists stats_map_idx     on public.match_player_stats (match_map_id);
create index if not exists stats_profile_idx on public.match_player_stats (profile_id);

alter table public.match_player_stats enable row level security;

drop policy if exists "stats_select_public" on public.match_player_stats;
create policy "stats_select_public" on public.match_player_stats
  for select using (true);

-- =============================================================================
-- MAP VETOES  (sequência de ban/pick pré-partida)
-- =============================================================================

create table if not exists public.map_vetoes (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  team_id     uuid not null references public.teams(id) on delete cascade,
  action      text not null check (action in ('ban','pick')),
  map_name    text not null,
  veto_order  integer not null,
  picked_side text check (picked_side in ('ct','t')),  -- apenas para picks
  created_at  timestamptz not null default timezone('utc', now()),
  unique (match_id, veto_order)
);

create index if not exists vetoes_match_idx on public.map_vetoes (match_id);

alter table public.map_vetoes enable row level security;

drop policy if exists "vetoes_select_public" on public.map_vetoes;
create policy "vetoes_select_public" on public.map_vetoes
  for select using (true);

-- =============================================================================
-- DATHOST SERVERS  (servidor provisionado por partida)
-- =============================================================================

create table if not exists public.dathost_servers (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid not null unique references public.matches(id) on delete cascade,
  dathost_id      text not null unique,   -- ID do servidor na API do Dathost
  ip              text not null,
  port            integer not null,
  gotv_port       integer,
  rcon_password   text not null,
  connect_string  text,                   -- "connect ip:port; password xxx"
  gotv_string     text,                   -- "connect ip:gotv_port"
  demo_url        text,                   -- URL da demo .dem após a partida
  status          text not null default 'provisioning'
                    check (status in ('provisioning','ready','live','finished','terminated')),
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

drop trigger if exists dathost_servers_set_updated_at on public.dathost_servers;
create trigger dathost_servers_set_updated_at
  before update on public.dathost_servers
  for each row execute procedure public.set_updated_at();

alter table public.dathost_servers enable row level security;

-- connect_string e rcon são sensíveis — não expor ao anon
drop policy if exists "dathost_select_public" on public.dathost_servers;
create policy "dathost_select_public" on public.dathost_servers
  for select using (false);  -- apenas service role acessa

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('match_start','checkin_reminder','result','system','team_invite')),
  title       text not null,
  message     text,
  link        text,            -- rota interna, ex: /matches/uuid
  read        boolean not null default false,
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_profile_idx on public.notifications (profile_id);
create index if not exists notifications_unread_idx  on public.notifications (profile_id, read) where read = false;

alter table public.notifications enable row level security;

-- Usuário só vê as próprias notificações
-- Como usamos service role na API, a policy abaixo protege o anon key direto
drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications
  for all using (false);  -- apenas service role; lógica de ownership fica na API

-- =============================================================================
-- BADGES  (catálogo)
-- =============================================================================

create table if not exists public.badges (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,    -- ex: "first_win", "champion_2025"
  name        text not null,
  description text not null,
  icon        text not null,           -- emoji ou nome de ícone lucide
  color       text not null default 'text-[var(--primary)]',
  created_at  timestamptz not null default timezone('utc', now())
);

create unique index if not exists badges_key_idx on public.badges (key);

alter table public.badges enable row level security;

drop policy if exists "badges_select_public" on public.badges;
create policy "badges_select_public" on public.badges
  for select using (true);

-- =============================================================================
-- PLAYER BADGES  (badges conquistadas)
-- =============================================================================

create table if not exists public.player_badges (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  badge_id    uuid not null references public.badges(id) on delete cascade,
  earned_at   timestamptz not null default timezone('utc', now()),
  unique (profile_id, badge_id)
);

create index if not exists player_badges_profile_idx on public.player_badges (profile_id);

alter table public.player_badges enable row level security;

drop policy if exists "player_badges_select_public" on public.player_badges;
create policy "player_badges_select_public" on public.player_badges
  for select using (true);

-- =============================================================================
-- ELO HISTORY  (histórico de variação de ELO por partida)
-- =============================================================================

create table if not exists public.elo_history (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  match_id    uuid references public.matches(id) on delete set null,
  elo_before  integer not null,
  elo_after   integer not null,
  delta       integer not null,   -- elo_after - elo_before
  created_at  timestamptz not null default timezone('utc', now())
);

create index if not exists elo_history_profile_idx on public.elo_history (profile_id);
create index if not exists elo_history_created_idx on public.elo_history (profile_id, created_at desc);

alter table public.elo_history enable row level security;

drop policy if exists "elo_history_select_public" on public.elo_history;
create policy "elo_history_select_public" on public.elo_history
  for select using (true);

-- =============================================================================
-- SEED: badges padrão da plataforma
-- =============================================================================

insert into public.badges (key, name, description, icon, color) values
  ('first_match',    'Primeira Partida',    'Disputou a primeira partida no BlueStrike.',        '🎯', 'text-[var(--primary)]'),
  ('first_win',      'Primeira Vitória',    'Venceu a primeira partida.',                        '🏆', 'text-yellow-400'),
  ('champion',       'Campeão',             'Venceu um campeonato oficial.',                     '👑', 'text-yellow-400'),
  ('captain',        'Capitão',             'Criou e lidera um time ativo.',                     '🛡️', 'text-[var(--primary)]'),
  ('top10_ranking',  'Top 10',              'Entrou no top 10 do ranking global.',               '⭐', 'text-orange-400'),
  ('veteran',        'Veterano',            'Disputou 50 partidas ou mais.',                     '🔱', 'text-gray-300')
on conflict (key) do nothing;
