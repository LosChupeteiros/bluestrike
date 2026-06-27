-- =============================================================================
-- BlueStrike — Migration: Pickup / Captains Draft lobby ("/chupeteiromestre")
-- Subsistema autocontido de pug/mix caseiro, independente de matches/teams.
-- Casual: sem ELO, sem coleta de stats. Apenas draft → veto → sobe servidor.
-- =============================================================================

-- ── Lobby (uma sala global ativa por vez) ────────────────────────────────────
create table if not exists public.pug_lobbies (
  id              uuid primary key default gen_random_uuid(),
  status          text not null default 'gathering'
                  check (status in (
                    'gathering','drafting','ready_check','veto','side_pick',
                    'provisioning','live','error','terminated'
                  )),
  bo_type         int not null default 3,

  -- Capitães (profile ids) e controle do draft
  captain_a       uuid references public.profiles(id) on delete set null,
  captain_b       uuid references public.profiles(id) on delete set null,
  first_pick      char(1) check (first_pick in ('a','b')),
  pick_turn       char(1) check (pick_turn in ('a','b')),

  -- Ready-check antes do veto
  ready_a         boolean not null default false,
  ready_b         boolean not null default false,

  -- Servidor DatHost / MatchZy
  matchzy_match_id   bigint,
  dathost_server_id  text,
  server_ip          text,
  server_port        int,
  gotv_port          int,
  server_password    text,
  connect_string     text,
  server_status      text check (server_status in (
                       'reserving','provisioning','ready','live','error','terminated'
                     )),

  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- No máximo UMA sala não-terminada por vez. Garante auto-criação segura contra
-- corrida: o segundo INSERT concorrente falha e o chamador re-seleciona.
create unique index if not exists pug_lobbies_one_active
  on public.pug_lobbies ((true))
  where status <> 'terminated';

-- ── Jogadores presentes / draftados ──────────────────────────────────────────
create table if not exists public.pug_lobby_players (
  id          uuid primary key default gen_random_uuid(),
  lobby_id    uuid not null references public.pug_lobbies(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  team        char(1) check (team in ('a','b')),   -- null = ainda no pool
  pick_order  int,                                  -- ordem em que foi draftado
  is_captain  boolean not null default false,
  last_seen   timestamptz not null default now(),
  joined_at   timestamptz not null default now(),
  unique (lobby_id, profile_id)
);

create index if not exists pug_lobby_players_lobby
  on public.pug_lobby_players (lobby_id);

-- ── Veto de mapas (ban ban pick pick ban ban + decider) ──────────────────────
create table if not exists public.pug_vetoes (
  id           uuid primary key default gen_random_uuid(),
  lobby_id     uuid not null references public.pug_lobbies(id) on delete cascade,
  team         char(1) not null check (team in ('a','b')),
  action       text not null check (action in ('ban','pick')),
  map_name     text not null,
  veto_order   int not null,
  picked_side  text check (picked_side in ('ct','t')),
  created_at   timestamptz not null default now(),
  unique (lobby_id, veto_order)
);

create index if not exists pug_vetoes_lobby
  on public.pug_vetoes (lobby_id);
