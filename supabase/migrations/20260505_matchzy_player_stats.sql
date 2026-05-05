-- matchzy_player_stats: raw per-player stats dumped from MySQL MatchZy tables.
-- Indexed by (match_id, mapnumber, steamid64) — all upserts are idempotent.
-- No FK lookups to profiles or teams required at write time.

CREATE TABLE IF NOT EXISTS public.matchzy_player_stats (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          uuid        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  matchzy_match_id  bigint      NOT NULL,
  mapnumber         int         NOT NULL DEFAULT 0,
  mapname           text,
  map_team1_score   int,
  map_team2_score   int,
  map_winner        text,
  steamid64         text        NOT NULL,
  player_name       text,
  team_name         text,
  kills             int         NOT NULL DEFAULT 0,
  deaths            int         NOT NULL DEFAULT 0,
  assists           int         NOT NULL DEFAULT 0,
  damage            int         NOT NULL DEFAULT 0,
  head_shot_kills   int         NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (match_id, mapnumber, steamid64)
);

CREATE INDEX IF NOT EXISTS matchzy_player_stats_match_idx
  ON public.matchzy_player_stats (match_id);

CREATE INDEX IF NOT EXISTS matchzy_player_stats_steamid_idx
  ON public.matchzy_player_stats (steamid64);

ALTER TABLE public.matchzy_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read matchzy_player_stats"
  ON public.matchzy_player_stats FOR SELECT USING (true);
