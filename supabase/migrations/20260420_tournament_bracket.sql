-- =============================================================================
-- BlueStrike — Migration: tournament bracket slot tracking
-- =============================================================================

-- match_index identifies the slot within a round for bracket advancement.
-- Winner of (round R, match_index I) advances to (round R+1, match_index floor(I/2)).
-- If I is even  → becomes team1 in the next match.
-- If I is odd   → becomes team2 in the next match.
alter table public.matches
  add column if not exists match_index integer not null default 0;

create index if not exists matches_bracket_idx
  on public.matches (tournament_id, round, match_index);
