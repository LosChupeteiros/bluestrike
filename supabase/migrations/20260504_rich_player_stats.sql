-- =============================================================================
-- BlueStrike — Rich player stats + map name on match_maps
-- =============================================================================

-- Extend match_player_stats with additional Dathost stat fields
ALTER TABLE public.match_player_stats
  ADD COLUMN IF NOT EXISTS mvps          integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS k2            integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS k3            integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS k4            integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS k5            integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS damage_dealt  integer NOT NULL DEFAULT 0;

-- Track map name on match_maps for scoreboard display
ALTER TABLE public.match_maps
  ADD COLUMN IF NOT EXISTS map_name text;
